import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Search, Star, Trash2, Copy, ExternalLink, Clock, Link2, QrCode, Youtube,
  Filter, X, Download, Upload, Check, Pencil, ChevronDown, StarOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useUrlHistory, ToolType, UrlHistoryItem, DateFilter } from '@/hooks/useUrlHistory';
import { useClipboard } from '@/hooks/useClipboard';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TOOL_ICONS: Record<ToolType, typeof Link2> = { 'utm': Link2, 'qr': QrCode, 'yt-finder': Youtube };
const TOOL_LABELS: Record<ToolType, string> = { 'utm': 'UTM Builder', 'qr': 'QR Generator', 'yt-finder': 'YT Finder' };
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

export function UrlHistoryPanel({ onLoadUrl, toolFilter, compact = false, maxHeight = '400px' }: UrlHistoryPanelProps) {
  const { history, stats, filters, setFilters, sortBy, setSortBy, toggleStar, removeFromHistory, removeMultiple, starMultiple, clearHistory, exportHistory, exportHistoryCsv, importHistory, updateHistoryItem } = useUrlHistory();
  const { copy } = useClipboard();
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isPanelFocused, setIsPanelFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < history.length) {
      const item = history[focusedIndex];
      const element = itemRefs.current.get(item.id);
      element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex, history]);

  useEffect(() => {
    if (focusedIndex >= history.length) setFocusedIndex(history.length > 0 ? history.length - 1 : -1);
  }, [history.length, focusedIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editingId || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    if (e.shiftKey && e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => { const next = prev + 1; if (next < history.length) { setSelectedIds(ps => { const ns = new Set(ps); ns.add(history[next].id); return ns; }); return next; } return prev; });
      return;
    }
    if (e.shiftKey && e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => { const next = prev - 1; if (next >= 0) { setSelectedIds(ps => { const ns = new Set(ps); ns.add(history[next].id); return ns; }); return next; } return 0; });
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(prev => prev + 1 < history.length ? prev + 1 : prev); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(prev => prev - 1 >= 0 ? prev - 1 : 0); return; }
    if (e.key === 'Home') { e.preventDefault(); if (history.length > 0) setFocusedIndex(0); return; }
    if (e.key === 'End') { e.preventDefault(); if (history.length > 0) setFocusedIndex(history.length - 1); return; }
    if (e.shiftKey && e.key === 'PageDown') {
      e.preventDefault();
      setFocusedIndex(prev => { const start = prev >= 0 ? prev : 0; const end = Math.min(start + 10, history.length - 1); setSelectedIds(ps => { const ns = new Set(ps); for (let i = start; i <= end; i++) ns.add(history[i].id); return ns; }); return end; });
      return;
    }
    if (e.shiftKey && e.key === 'PageUp') {
      e.preventDefault();
      setFocusedIndex(prev => { const start = prev >= 0 ? prev : history.length - 1; const end = Math.max(start - 10, 0); setSelectedIds(ps => { const ns = new Set(ps); for (let i = start; i >= end; i--) ns.add(history[i].id); return ns; }); return end; });
      return;
    }
    if (e.key === 'PageDown') { e.preventDefault(); setFocusedIndex(prev => Math.min(prev + 10, history.length - 1)); return; }
    if (e.key === 'PageUp') { e.preventDefault(); setFocusedIndex(prev => Math.max(prev - 10, 0)); return; }
    if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < history.length && onLoadUrl) {
      e.preventDefault(); onLoadUrl(history[focusedIndex]); toast({ title: t('histPanel.loaded'), description: t('histPanel.loadedDesc') }); return;
    }
    if (e.key === ' ' && focusedIndex >= 0 && focusedIndex < history.length) {
      e.preventDefault(); const item = history[focusedIndex]; handleSelectItem(item.id, !selectedIds.has(item.id)); return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault(); setSelectedIds(new Set(history.map(h => h.id))); toast({ title: t('histPanel.selectedAll'), description: t('histPanel.selectedAllDesc', { count: history.length }) }); return;
    }
    if (e.key === 'Escape') {
      if (selectedIds.size > 0 || focusedIndex >= 0) { e.preventDefault(); setSelectedIds(new Set()); setFocusedIndex(-1); toast({ title: t('histPanel.selectionCleared') }); } return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) { e.preventDefault(); setDeleteDialogOpen(true); return; }
    if (e.key === 's' && !e.ctrlKey && !e.metaKey && selectedIds.size > 0) {
      e.preventDefault(); starMultiple(Array.from(selectedIds), true); toast({ title: t('histPanel.starredItems'), description: t('histPanel.starredDesc', { count: selectedIds.size }) }); return;
    }
    if (e.key === 'u' && selectedIds.size > 0) {
      e.preventDefault(); starMultiple(Array.from(selectedIds), false); toast({ title: t('histPanel.unstarredItems'), description: t('histPanel.unstarredDesc', { count: selectedIds.size }) }); return;
    }
    if (e.key === 'c' && !e.ctrlKey && !e.metaKey && selectedIds.size > 0) {
      e.preventDefault(); const urls = history.filter(h => selectedIds.has(h.id)).map(h => h.url).join('\n'); copy(urls, t('histPanel.urlsCopied', { count: selectedIds.size })); return;
    }
    if (e.key === '/') { e.preventDefault(); const si = panelRef.current?.querySelector('input[type="text"]') as HTMLInputElement; si?.focus(); return; }
  }, [editingId, history, selectedIds, focusedIndex, onLoadUrl, starMultiple, copy, toast, t]);

  useEffect(() => {
    if (!isPanelFocused) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelFocused, handleKeyDown]);

  useMemo(() => { if (toolFilter && filters.toolType !== toolFilter) setFilters(prev => ({ ...prev, toolType: toolFilter })); }, [toolFilter]);

  const handleSearchChange = (value: string) => setFilters(prev => ({ ...prev, search: value }));
  const handleToolFilterChange = (tool: ToolType | 'all') => setFilters(prev => ({ ...prev, toolType: tool }));
  const handleDateFilterChange = (date: DateFilter) => setFilters(prev => ({ ...prev, dateRange: date }));
  const handleStarredToggle = () => setFilters(prev => ({ ...prev, starredOnly: !prev.starredOnly }));
  const handleSelectItem = (id: string, checked: boolean) => { setSelectedIds(prev => { const ns = new Set(prev); checked ? ns.add(id) : ns.delete(id); return ns; }); };
  const handleSelectAll = (checked: boolean) => { setSelectedIds(checked ? new Set(history.map(h => h.id)) : new Set()); };

  const handleDeleteSelected = () => {
    removeMultiple(Array.from(selectedIds)); setSelectedIds(new Set()); setDeleteDialogOpen(false);
    toast({ title: t('histPanel.deleted'), description: t('histPanel.deletedDesc', { count: selectedIds.size }) });
  };
  const handleCopySelected = () => { const urls = history.filter(h => selectedIds.has(h.id)).map(h => h.url).join('\n'); copy(urls, t('histPanel.urlsCopied', { count: selectedIds.size })); };
  const handleExportSelected = () => {
    const items = history.filter(h => selectedIds.has(h.id));
    const data = JSON.stringify(items, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ga-toolkit-history-${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: t('histPanel.exported'), description: t('histPanel.exportedDesc', { count: items.length }) });
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const result = await importHistory(file);
      const desc = t('histPanel.importedDesc', { added: result.added }) + (result.duplicates > 0 ? t('histPanel.importedDupes', { dupes: result.duplicates }) : '');
      toast({ title: t('histPanel.imported'), description: desc });
    } catch { toast({ title: t('histPanel.importFailed'), description: t('histPanel.importFailedDesc'), variant: 'destructive' }); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleStartEdit = (item: UrlHistoryItem) => { setEditingId(item.id); setEditingName(item.name); };
  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) { updateHistoryItem(editingId, { name: editingName.trim() }); toast({ title: t('histPanel.updated'), description: t('histPanel.updatedDesc') }); }
    setEditingId(null); setEditingName('');
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return t('histPanel.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('histPanel.mAgo', { m: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('histPanel.hAgo', { h: hours });
    const days = Math.floor(hours / 24);
    return t('histPanel.dAgo', { d: days });
  };

  const hasActiveFilters = filters.search || filters.toolType !== 'all' || filters.dateRange !== 'all' || filters.starredOnly;

  const dateLabel = filters.dateRange === 'all' ? t('histPanel.allTime') : filters.dateRange === 'today' ? t('histPanel.today') : filters.dateRange === 'week' ? t('histPanel.thisWeek') : t('histPanel.thisMonth');

  return (
    <div ref={panelRef} className="flex flex-col h-full outline-none" tabIndex={0}
      onFocus={() => setIsPanelFocused(true)}
      onBlur={(e) => { if (!panelRef.current?.contains(e.relatedTarget as Node)) setIsPanelFocused(false); }}
    >
      {/* Search and Filters */}
      <div className="space-y-2 p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('histPanel.searchPlaceholder')} value={filters.search} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9 h-9 text-sm" />
          {filters.search && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => handleSearchChange('')}><X className="h-3.5 w-3.5" /></Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!toolFilter && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  {filters.toolType === 'all' ? t('histPanel.allTools') : TOOL_LABELS[filters.toolType]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleToolFilterChange('all')}>{t('histPanel.allTools')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToolFilterChange('utm')}><Link2 className="h-4 w-4 mr-2" /> UTM Builder</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToolFilterChange('qr')}><QrCode className="h-4 w-4 mr-2" /> QR Generator</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToolFilterChange('yt-finder')}><Youtube className="h-4 w-4 mr-2" /> YT Finder</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs"><Clock className="h-3.5 w-3.5 mr-1" />{dateLabel}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleDateFilterChange('all')}>{t('histPanel.allTime')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateFilterChange('today')}>{t('histPanel.today')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateFilterChange('week')}>{t('histPanel.thisWeek')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateFilterChange('month')}>{t('histPanel.thisMonth')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant={filters.starredOnly ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={handleStarredToggle}>
            <Star className={cn("h-3.5 w-3.5 mr-1", filters.starredOnly && "fill-current")} />
            {t('histPanel.starred')}
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setFilters({ search: '', toolType: 'all', dateRange: 'all', starredOnly: false })}>
              <X className="h-3.5 w-3.5 mr-1" />{t('histPanel.clear')}
            </Button>
          )}

          <div className="flex-1" />


          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 text-xs"><ChevronDown className="h-3.5 w-3.5 mr-1" />{t('histPanel.sort')}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem checked={sortBy === 'newest'} onClick={() => setSortBy('newest')}>{t('histPanel.newestFirst')}</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={sortBy === 'oldest'} onClick={() => setSortBy('oldest')}>{t('histPanel.oldestFirst')}</DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={sortBy === 'name-asc'} onClick={() => setSortBy('name-asc')}>{t('histPanel.nameAZ')}</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={sortBy === 'name-desc'} onClick={() => setSortBy('name-desc')}>{t('histPanel.nameZA')}</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
            <span className="text-xs text-muted-foreground">{t('histPanel.selected', { count: selectedIds.size })}</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopySelected}><Copy className="h-3 w-3 mr-1" /> {t('histPanel.copy')}</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleExportSelected}><Download className="h-3 w-3 mr-1" /> {t('histPanel.exportBtn')}</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { starMultiple(Array.from(selectedIds), true); toast({ title: t('histPanel.starredItems'), description: t('histPanel.starredDesc', { count: selectedIds.size }) }); }}><Star className="h-3 w-3 mr-1" /> {t('histPanel.star')}</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { starMultiple(Array.from(selectedIds), false); toast({ title: t('histPanel.unstarredItems'), description: t('histPanel.unstarredDesc', { count: selectedIds.size }) }); }}><StarOff className="h-3 w-3 mr-1" /> {t('histPanel.unstar')}</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="h-3 w-3 mr-1" /> {t('histPanel.delete')}</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}><X className="h-3 w-3 mr-1" /> {t('histPanel.clear')}</Button>
          </div>
        )}
      </div>

      {!compact && (
        <div className="flex items-center gap-4 px-3 py-2 border-b text-xs text-muted-foreground">
          <span>Total: {stats.total}</span>
          <span>UTM: {stats.byTool.utm}</span>
          <span>QR: {stats.byTool.qr}</span>
          <span>YT: {stats.byTool['yt-finder']}</span>
          <span>⭐ {stats.starred}</span>
        </div>
      )}

      <ScrollArea className="flex-1" style={{ maxHeight }}>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">{t('histPanel.noHistory')}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{hasActiveFilters ? t('histPanel.adjustFilters') : t('histPanel.willAppear')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {history.map((item, index) => {
              const Icon = TOOL_ICONS[item.toolType];
              const isEditing = editingId === item.id;
              const isFocused = focusedIndex === index;
              return (
                <div key={item.id} ref={(el) => { if (el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}
                  className={cn("flex items-start gap-2 p-3 hover:bg-muted/50 transition-colors group cursor-pointer", selectedIds.has(item.id) && "bg-muted/30", isFocused && "ring-2 ring-primary ring-inset bg-primary/5")}
                  onClick={() => setFocusedIndex(index)} onDoubleClick={() => onLoadUrl?.(item)}
                >
                  <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)} className="mt-0.5" onClick={(e) => e.stopPropagation()} />
                  <div className={cn("p-1.5 rounded-md flex-shrink-0", TOOL_COLORS[item.toolType])}><Icon className="h-3.5 w-3.5" /></div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} onBlur={handleSaveEdit}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') { setEditingId(null); setEditingName(''); } }}
                          className="h-6 text-sm px-1" autoFocus />
                      ) : (
                        <span className="text-sm font-medium truncate cursor-pointer hover:text-primary" onClick={() => handleStartEdit(item)}>{item.name}</span>
                      )}
                      {item.starred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-mono">{item.url.length > 60 ? item.url.slice(0, 60) + '...' : item.url}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.tags.slice(0, 3).map((tag, i) => (<Badge key={i} variant="secondary" className="text-[10px] h-4 px-1.5">{tag}</Badge>))}
                      <span className="text-[10px] text-muted-foreground">{formatTimeAgo(item.timestamp)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStar(item.id)}><Star className={cn("h-3.5 w-3.5", item.starred && "text-yellow-500 fill-yellow-500")} /></Button></TooltipTrigger><TooltipContent>{item.starred ? t('histPanel.unstar') : t('histPanel.star')}</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(item.url, t('histPanel.copyUrl'))}><Copy className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>{t('histPanel.copyUrl')}</TooltipContent></Tooltip>
                    {onLoadUrl && (<Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onLoadUrl(item)}><ExternalLink className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>{t('histPanel.load')}</TooltipContent></Tooltip>)}
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { removeFromHistory(item.id); toast({ title: t('histPanel.removed'), description: t('histPanel.removedDesc') }); }}><Trash2 className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>{t('histPanel.delete')}</TooltipContent></Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="flex items-center justify-between p-3 border-t">
        <div className="flex items-center gap-2">
          <Checkbox checked={selectedIds.size === history.length && history.length > 0} onCheckedChange={handleSelectAll} className="mr-1" />
          <span className="text-xs text-muted-foreground">{t('histPanel.selectAll')}</span>
        </div>
        <div className="flex items-center gap-1">
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()}><Upload className="h-3 w-3 mr-1" /> {t('histPanel.import')}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 text-xs"><Download className="h-3 w-3 mr-1" /> {t('histPanel.exportBtn')}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportHistory()}>{t('histPanel.exportJson')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportHistoryCsv()}>{t('histPanel.exportCsv')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setClearDialogOpen(true)} disabled={history.length === 0}><Trash2 className="h-3 w-3 mr-1" /> {t('histPanel.clearAll')}</Button>
        </div>
      </div>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('histPanel.clearAllTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('histPanel.clearAllDesc', { count: stats.total })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { clearHistory(); setClearDialogOpen(false); toast({ title: t('histPanel.cleared'), description: t('histPanel.clearedDesc') }); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('histPanel.clearAll')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('histPanel.deleteTitle', { count: selectedIds.size })}</AlertDialogTitle>
            <AlertDialogDescription>{t('histPanel.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('histPanel.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
