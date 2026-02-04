import { useState } from 'react';
import { Save, FolderOpen, Trash2, Copy, Edit2, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ROASScenario, ROASScenarioData } from '@/hooks/useROASScenarios';

interface ScenarioManagerProps {
  scenarios: ROASScenario[];
  currentScenarioId: string | null;
  currentData: ROASScenarioData;
  onSave: (name: string, data: ROASScenarioData) => void;
  onLoad: (id: string) => ROASScenario | undefined;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onUpdate: (id: string, data: Partial<Pick<ROASScenario, 'name' | 'data'>>) => void;
}

export function ScenarioManager({
  scenarios,
  currentScenarioId,
  currentData,
  onSave,
  onLoad,
  onDelete,
  onDuplicate,
  onRename,
  onUpdate,
}: ScenarioManagerProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleSave = () => {
    onSave(scenarioName, currentData);
    setScenarioName('');
    setSaveDialogOpen(false);
  };

  const handleUpdateCurrent = () => {
    if (currentScenarioId) {
      onUpdate(currentScenarioId, { data: currentData });
    }
  };

  const handleLoad = (id: string) => {
    onLoad(id);
    setLoadDialogOpen(false);
  };

  const handleDelete = () => {
    if (scenarioToDelete) {
      onDelete(scenarioToDelete);
      setScenarioToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleStartEdit = (scenario: ROASScenario) => {
    setEditingId(scenario.id);
    setEditingName(scenario.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName);
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasData = Object.values(currentData).some(v => v !== '' && v !== '20');

  return (
    <div className="flex items-center gap-2">
      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={!hasData}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Scenario</DialogTitle>
            <DialogDescription>
              Save your current calculator values as a named scenario for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                placeholder="e.g., Q1 Campaign, Product Launch"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Current Button */}
      {currentScenarioId && hasData && (
        <Button variant="outline" size="sm" onClick={handleUpdateCurrent}>
          <Save className="h-4 w-4 mr-1" />
          Update
        </Button>
      )}

      {/* Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={scenarios.length === 0}>
            <FolderOpen className="h-4 w-4 mr-1" />
            Load
            {scenarios.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                {scenarios.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Load Scenario</DialogTitle>
            <DialogDescription>
              Select a saved scenario to load into the calculator.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2 py-4">
              {scenarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved scenarios yet</p>
                  <p className="text-sm">Save your first scenario to get started</p>
                </div>
              ) : (
                scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={cn(
                      "p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
                      currentScenarioId === scenario.id && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {editingId === scenario.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="h-7 text-sm"
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{scenario.name}</span>
                              {currentScenarioId === scenario.id && (
                                <Badge variant="default" className="text-xs">Active</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(scenario.updatedAt)}
                            </div>
                          </>
                        )}
                      </div>
                      {editingId !== scenario.id && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleLoad(scenario.id)}
                            title="Load scenario"
                          >
                            <FolderOpen className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(scenario)}
                            title="Rename"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => onDuplicate(scenario.id)}
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setScenarioToDelete(scenario.id);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scenario</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scenario? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setScenarioToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
