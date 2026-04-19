import { useEffect, useRef, useState } from 'react';
import { Keyboard, RotateCcw, Pencil, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { TranslationKey } from '@/i18n/translations';
import { useShortcuts } from '@/contexts/ShortcutsContext';
import {
  ACTION_LABEL_KEYS,
  SHORTCUT_GROUPS,
  ShortcutAction,
  ShortcutBinding,
  eventToBinding,
  findConflict,
  formatBinding,
} from '@/lib/shortcuts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open: controlledOpen, onOpenChange }: KeyboardShortcutsDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { t } = useTranslation();
  const { bindings, setBinding, resetAll } = useShortcuts();
  const [editing, setEditing] = useState<ShortcutAction | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  // Cancel editing when dialog closes
  useEffect(() => {
    if (!open) setEditing(null);
  }, [open]);

  // Capture next keypress while editing
  useEffect(() => {
    if (!editing) return;
    const handler = (e: KeyboardEvent) => {
      // Allow Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setEditing(null);
        return;
      }
      const candidate = eventToBinding(e);
      if (!candidate) return; // lone modifier
      e.preventDefault();
      e.stopPropagation();

      const conflict = findConflict(bindings, candidate, editing);
      if (conflict) {
        const conflictLabel = t(ACTION_LABEL_KEYS[conflict] as TranslationKey);
        toast.error(t('kbd.conflict', { action: conflictLabel }));
        return;
      }
      setBinding(editing, candidate);
      toast.success(t('kbd.updated'));
      setEditing(null);
    };
    // capture phase so we intercept before global shortcuts dispatcher
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [editing, bindings, setBinding, t]);

  const handleResetAll = () => {
    resetAll();
    toast.success(t('kbd.resetAllDone'));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            {t('kbd.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {SHORTCUT_GROUPS.map(({ group, actions }) => (
            <div key={group}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t(group === 'navigation' ? 'kbd.navigation' : 'kbd.pageActions')}
              </h3>
              <div className="space-y-1.5" ref={group === 'navigation' ? captureRef : undefined}>
                {actions.map((action) => {
                  const binding = bindings[action];
                  const isEditing = editing === action;
                  return (
                    <div
                      key={action}
                      className={cn(
                        'flex items-center justify-between gap-2 text-sm rounded-md px-2 py-1.5 transition-colors',
                        isEditing ? 'bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50',
                      )}
                    >
                      <span className="truncate">{t(ACTION_LABEL_KEYS[action] as TranslationKey)}</span>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <span className="text-xs text-primary font-medium animate-pulse">
                              {t('kbd.pressKeys')}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setEditing(null)}
                              aria-label={t('common.cancel')}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex gap-1">
                              {formatBinding(binding).map((part, i) => (
                                <kbd
                                  key={i}
                                  className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded min-w-[28px] text-center"
                                >
                                  {part}
                                </kbd>
                              ))}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 opacity-60 hover:opacity-100"
                              onClick={() => setEditing(action)}
                              aria-label={t('kbd.editShortcut')}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">{t('kbd.toggleHint', { key: '?' })}</p>
            <Button size="sm" variant="outline" onClick={handleResetAll} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              {t('kbd.resetAll')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
