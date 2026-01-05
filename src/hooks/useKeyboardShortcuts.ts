import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutAction[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Global navigation shortcuts hook
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  const shortcuts: ShortcutAction[] = [
    { key: '1', ctrl: true, action: () => navigate('/'), description: 'Go to Dashboard' },
    { key: '2', ctrl: true, action: () => navigate('/utm-builder'), description: 'Go to UTM Builder' },
    { key: '3', ctrl: true, action: () => navigate('/qr-generator'), description: 'Go to QR Generator' },
    { key: '4', ctrl: true, action: () => navigate('/keyword-combiner'), description: 'Go to Keyword Combiner' },
    { key: '5', ctrl: true, action: () => navigate('/keyword-mixer'), description: 'Go to Keyword Mixer' },
    { key: '6', ctrl: true, action: () => navigate('/keyword-tools'), description: 'Go to Keyword Tools' },
    { key: '7', ctrl: true, action: () => navigate('/yt-finder'), description: 'Go to YT Finder' },
  ];

  useKeyboardShortcuts(shortcuts);
}

// Shortcut definitions for help display
export const GLOBAL_SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Open command palette' },
  { keys: ['Ctrl', '1'], description: 'Dashboard' },
  { keys: ['Ctrl', '2'], description: 'UTM Builder' },
  { keys: ['Ctrl', '3'], description: 'QR Generator' },
  { keys: ['Ctrl', '4'], description: 'Keyword Combiner' },
  { keys: ['Ctrl', '5'], description: 'Keyword Mixer' },
  { keys: ['Ctrl', '6'], description: 'Keyword Tools' },
  { keys: ['Ctrl', '7'], description: 'YT Finder' },
  { keys: ['?'], description: 'Show shortcuts help' },
];

export const PAGE_SHORTCUTS = [
  { keys: ['Shift', 'C'], description: 'Copy result' },
  { keys: ['Shift', 'R'], description: 'Reset form' },
  { keys: ['Shift', 'S'], description: 'Load sample data' },
  { keys: ['Shift', 'F'], description: 'Fetch data (YT Finder)' },
  { keys: ['Shift', 'X'], description: 'Cancel request (YT Finder)' },
];
