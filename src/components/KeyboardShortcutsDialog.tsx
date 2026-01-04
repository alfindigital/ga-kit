import { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GLOBAL_SHORTCUTS, PAGE_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open: controlledOpen, onOpenChange }: KeyboardShortcutsDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Navigation */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Navigation</h3>
            <div className="space-y-1.5">
              {GLOBAL_SHORTCUTS.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd
                        key={j}
                        className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Page Actions */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Page Actions</h3>
            <div className="space-y-1.5">
              {PAGE_SHORTCUTS.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd
                        key={j}
                        className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded">?</kbd> to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
