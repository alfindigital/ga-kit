import React, { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { TranslationKey } from '@/i18n/translations';

interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const GLOBAL_SHORTCUT_ITEMS: { keys: string[]; tKey: TranslationKey }[] = [
  { keys: ['Ctrl', 'K'], tKey: 'kbd.openCommandPalette' },
  { keys: ['Ctrl', '1'], tKey: 'kbd.dashboard' },
  { keys: ['Ctrl', '2'], tKey: 'nav.utmBuilder' },
  { keys: ['Ctrl', '3'], tKey: 'tool.qrGenerator' },
  { keys: ['Ctrl', '4'], tKey: 'tool.keywordCombiner' },
  { keys: ['Ctrl', '5'], tKey: 'tool.keywordMixer' },
  { keys: ['Ctrl', '6'], tKey: 'tool.keywordTools' },
  { keys: ['Ctrl', '7'], tKey: 'tool.ytFinder' },
  { keys: ['?'], tKey: 'kbd.showShortcuts' },
];

const PAGE_SHORTCUT_ITEMS: { keys: string[]; tKey: TranslationKey }[] = [
  { keys: ['Shift', 'C'], tKey: 'kbd.copyResult' },
  { keys: ['Shift', 'R'], tKey: 'kbd.resetForm' },
  { keys: ['Shift', 'S'], tKey: 'kbd.loadSample' },
  { keys: ['Shift', 'V'], tKey: 'kbd.validateUrls' },
  { keys: ['Shift', 'H'], tKey: 'kbd.generateHashes' },
  { keys: ['Shift', 'F'], tKey: 'kbd.fetchData' },
  { keys: ['Shift', 'X'], tKey: 'kbd.cancelRequest' },
];

export function KeyboardShortcutsDialog({ open: controlledOpen, onOpenChange }: KeyboardShortcutsDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { t } = useTranslation();
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
            {t('kbd.title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('kbd.navigation')}</h3>
            <div className="space-y-1.5">
              {GLOBAL_SHORTCUT_ITEMS.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{t(shortcut.tKey)}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd key={j} className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded">
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('kbd.pageActions')}</h3>
            <div className="space-y-1.5">
              {PAGE_SHORTCUT_ITEMS.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{t(shortcut.tKey)}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd key={j} className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded">
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            {t('kbd.toggleHint', { key: '?' })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
