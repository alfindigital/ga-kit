import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Search, 
  Star, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Clock,
  Link2,
  QrCode,
  Youtube,
  Filter,
  X,
  Download,
  Upload,
  Check,
  Pencil,
  ChevronDown,
  StarOff,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useUrlHistory, ToolType, UrlHistoryItem, DateFilter } from '@/hooks/useUrlHistory';
import { useClipboard } from '@/hooks/useClipboard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TOOL_ICONS: Record<ToolType, typeof Link2> = {
  'utm': Link2,
  'qr': QrCode,
  'yt-finder': Youtube,
};

const TOOL_LABELS: Record<ToolType, string> = {
  'utm': 'UTM Builder',
  'qr': 'QR Generator',
  'yt-finder': 'YT Finder',
};

const TOOL_COLORS: Record<ToolType, string> = {
  'utm': 'bg-primary/10 text-primary',
  'qr': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  'yt-finder': 'bg-destructive/10 text-destructive',
};

interface UrlHistoryPanelProps {
  onLoadUrl?: (item: UrlHistoryItem) => void;
  toolFilter?: ToolType;
  compact?: boolean;
  maxHeight?: string;
}

export function UrlHistoryPanel({ 
  onLoadUrl, 
  toolFilter,
  compact = false,
  maxHeight = '400px'
}: UrlHistoryPanelProps) {
  const {
    history,
    stats,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    toggleStar,
    removeFromHistory,
    removeMultiple,
    starMultiple,
    clearHistory,
    exportHistory,
    exportHistoryCsv,
    importHistory,
    updateHistoryItem,
  } = useUrlHistory();

  const { copy } = useClipboard();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isPanelFocused, setIsPanelFocused] = useState(false);

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when editing or typing in input
    if (editingId || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Ctrl/Cmd + A: Select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      setSelectedIds(new Set(history.map(h => h.id)));
      toast({ title: 'Selected all', description: `${history.length} items selected` });
      return;
    }

    // Escape: Clear selection
    if (e.key === 'Escape') {
      if (selectedIds.size > 0) {
        e.preventDefault();
        setSelectedIds(new Set());
        toast({ title: 'Selection cleared' });
      }
      return;
    }

    // Delete/Backspace: Delete selected (with confirmation)
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
      e.preventDefault();
      setDeleteDialogOpen(true);
      return;
    }

    // S: Star selected
    if (e.key === 's' && !e.ctrlKey && !e.metaKey && selectedIds.size > 0) {
      e.preventDefault();
      starMultiple(Array.from(selectedIds), true);
      toast({ title: 'Starred', description: `${selectedIds.size} items starred` });
      return;
    }

    // U: Unstar selected
    if (e.key === 'u' && selectedIds.size > 0) {
      e.preventDefault();
      starMultiple(Array.from(selectedIds), false);
      toast({ title: 'Unstarred', description: `${selectedIds.size} items unstarred` });
      return;
    }

    // C: Copy selected URLs
    if (e.key === 'c' && !e.ctrlKey && !e.metaKey && selectedIds.size > 0) {
      e.preventDefault();
      const urls = history
        .filter(h => selectedIds.has(h.id))
        .map(h => h.url)
        .join('\n');
      copy(urls, `${selectedIds.size} URLs copied`);
      return;
    }

    // /: Focus search
    if (e.key === '/') {
      e.preventDefault();
      const searchInput = panelRef.current?.querySelector('input[type="text"]') as HTMLInputElement;
      searchInput?.focus();
      return;
    }
  }, [editingId, history, selectedIds, starMultiple, copy, toast]);

  // Register keyboard shortcuts when panel is focused
  useEffect(() => {
    if (!isPanelFocused) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelFocused, handleKeyDown]);

  // Apply tool filter from props
  const effectiveFilters = useMemo(() => ({
    ...filters,
    toolType: toolFilter || filters.toolType,
  }), [filters, toolFilter]);

  // Update filters when toolFilter prop changes
  useMemo(() => {
    if (toolFilter && filters.toolType !== toolFilter) {
      setFilters(prev => ({ ...prev, toolType: toolFilter }));
    }
  }, [toolFilter]);

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleToolFilterChange = (tool: ToolType | 'all') => {
    setFilters(prev => ({ ...prev, toolType: tool }));
  };

  const handleDateFilterChange = (date: DateFilter) => {
    setFilters(prev => ({ ...prev, dateRange: date }));
  };

  const handleStarredToggle = () => {
    setFilters(prev => ({ ...prev, starredOnly: !prev.starredOnly }));
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(history.map(h => h.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = () => {
    removeMultiple(Array.from(selectedIds));
    setSelectedIds(new Set());
    setDeleteDialogOpen(false);
    toast({ title: 'Deleted', description: `${selectedIds.size} items removed` });
  };

  const handleCopySelected = () => {
    const urls = history
      .filter(h => selectedIds.has(h.id))
      .map(h => h.url)
      .join('\n');
    copy(urls, `${selectedIds.size} URLs copied`);
  };

  const handleExportSelected = () => {
    const items = history.filter(h => selectedIds.has(h.id));
    // Export as JSON by triggering a download
    const data = JSON.stringify(items, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ga-toolkit-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${items.length} items exported` });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await importHistory(file);
      toast({
        title: 'Imported!',
        description: `Added ${result.added} items${result.duplicates > 0 ? `, ${result.duplicates} duplicates skipped` : ''}`,
      });
    } catch {
      toast({ title: 'Import failed', description: 'Invalid file format', variant: 'destructive' });
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartEdit = (item: UrlHistoryItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateHistoryItem(editingId, { name: editingName.trim() });
      toast({ title: 'Updated', description: 'Name saved' });
    }
    setEditingId(null);
    setEditingName('');
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const hasActiveFilters = filters.search || filters.toolType !== 'all' || filters.dateRange !== 'all' || filters.starredOnly;

  return (
    <div 
      ref={panelRef}
      className="flex flex-col h-full outline-none"
      tabIndex={0}
      onFocus={() => setIsPanelFocused(true)}
      onBlur={(e) => {
        // Only blur if focus is leaving the panel entirely
        if (!panelRef.current?.contains(e.relatedTarget as Node)) {
          setIsPanelFocused(false);
        }
      }}
    >
      {/* Search and Filters */}
      <div className="space-y-2 p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search URLs, names, tags..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tool Filter */}
          {!toolFilter && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  {filters.toolType === 'all' ? 'All Tools' : TOOL_LABELS[filters.toolType]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleToolFilterChange('all')}>
                  All Tools
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToolFilterChange('utm')}>
                  <Link2 className="h-4 w-4 mr-2" /> UTM Builder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToolFilterChange('qr')}>
                  <QrCode className="h-4 w-4 mr-2" /> QR Generator
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToolFilterChange('yt-finder')}>
                  <Youtube className="h-4 w-4 mr-2" /> YT Finder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Date Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Clock className="h-3.5 w-3.5 mr-1" />
                {filters.dateRange === 'all' ? 'All Time' : 
                  filters.dateRange === 'today' ? 'Today' :
                  filters.dateRange === 'week' ? 'This Week' : 'This Month'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleDateFilterChange('all')}>All Time</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateFilterChange('today')}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateFilterChange('week')}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateFilterChange('month')}>This Month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Starred Toggle */}
          <Button
            variant={filters.starredOnly ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={handleStarredToggle}
          >
            <Star className={cn("h-3.5 w-3.5 mr-1", filters.starredOnly && "fill-current")} />
            Starred
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setFilters({ search: '', toolType: 'all', dateRange: 'all', starredOnly: false })}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}

          <div className="flex-1" />

          {/* Keyboard Shortcuts Hint */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Keyboard className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1.5 text-xs">
                <p className="font-medium mb-2">Keyboard Shortcuts</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">Select all</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl+A</kbd>
                  <span className="text-muted-foreground">Clear selection</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>
                  <span className="text-muted-foreground">Delete selected</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Delete</kbd>
                  <span className="text-muted-foreground">Star selected</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">S</kbd>
                  <span className="text-muted-foreground">Unstar selected</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">U</kbd>
                  <span className="text-muted-foreground">Copy URLs</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">C</kbd>
                  <span className="text-muted-foreground">Focus search</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">/</kbd>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem checked={sortBy === 'newest'} onClick={() => setSortBy('newest')}>
                Newest First
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={sortBy === 'oldest'} onClick={() => setSortBy('oldest')}>
                Oldest First
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={sortBy === 'name-asc'} onClick={() => setSortBy('name-asc')}>
                Name A-Z
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={sortBy === 'name-desc'} onClick={() => setSortBy('name-desc')}>
                Name Z-A
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopySelected}>
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleExportSelected}>
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => {
                starMultiple(Array.from(selectedIds), true);
                toast({ title: 'Starred', description: `${selectedIds.size} items starred` });
              }}
            >
              <Star className="h-3 w-3 mr-1" /> Star
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => {
                starMultiple(Array.from(selectedIds), false);
                toast({ title: 'Unstarred', description: `${selectedIds.size} items unstarred` });
              }}
            >
              <StarOff className="h-3 w-3 mr-1" /> Unstar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          </div>
        )}
      </div>

      {/* Stats (non-compact) */}
      {!compact && (
        <div className="flex items-center gap-4 px-3 py-2 border-b text-xs text-muted-foreground">
          <span>Total: {stats.total}</span>
          <span>UTM: {stats.byTool.utm}</span>
          <span>QR: {stats.byTool.qr}</span>
          <span>YT: {stats.byTool['yt-finder']}</span>
          <span>⭐ {stats.starred}</span>
        </div>
      )}

      {/* History List */}
      <ScrollArea className="flex-1" style={{ maxHeight }}>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No history found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Generated URLs will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {history.map((item) => {
              const Icon = TOOL_ICONS[item.toolType];
              const isEditing = editingId === item.id;
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-2 p-3 hover:bg-muted/50 transition-colors group",
                    selectedIds.has(item.id) && "bg-muted/30"
                  )}
                >
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                    className="mt-0.5"
                  />

                  <div className={cn("p-1.5 rounded-md flex-shrink-0", TOOL_COLORS[item.toolType])}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Name */}
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setEditingName('');
                            }
                          }}
                          className="h-6 text-sm px-1"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="text-sm font-medium truncate cursor-pointer hover:text-primary"
                          onClick={() => handleStartEdit(item)}
                        >
                          {item.name}
                        </span>
                      )}
                      {item.starred && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* URL */}
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {item.url.length > 60 ? item.url.slice(0, 60) + '...' : item.url}
                    </p>

                    {/* Tags and Time */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] h-4 px-1.5">
                          {tag}
                        </Badge>
                      ))}
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleStar(item.id)}
                        >
                          <Star className={cn(
                            "h-3.5 w-3.5",
                            item.starred && "text-yellow-500 fill-yellow-500"
                          )} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{item.starred ? 'Unstar' : 'Star'}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copy(item.url, 'URL copied')}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy URL</TooltipContent>
                    </Tooltip>

                    {onLoadUrl && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onLoadUrl(item)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Load</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => {
                            removeFromHistory(item.id);
                            toast({ title: 'Removed', description: 'Item deleted from history' });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-3 border-t">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === history.length && history.length > 0}
            onCheckedChange={handleSelectAll}
            className="mr-1"
          />
          <span className="text-xs text-muted-foreground">Select all</span>
        </div>

        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3 w-3 mr-1" /> Import
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportHistory()}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportHistoryCsv()}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => setClearDialogOpen(true)}
            disabled={history.length === 0}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Clear All
          </Button>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {stats.total} items from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearHistory();
                setClearDialogOpen(false);
                toast({ title: 'Cleared', description: 'All history deleted' });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Selected Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
