import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SHORTCUTS,
  ShortcutAction,
  ShortcutBinding,
  loadShortcuts,
  saveShortcuts,
  clearShortcuts,
  matchesBinding,
} from '@/lib/shortcuts';

interface ShortcutsContextValue {
  bindings: Record<ShortcutAction, ShortcutBinding>;
  setBinding: (action: ShortcutAction, binding: ShortcutBinding) => void;
  resetAll: () => void;
  // Subscribe to an action being triggered. Returns unsubscribe.
  subscribe: (action: ShortcutAction, handler: () => void) => () => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue | undefined>(undefined);

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [bindings, setBindings] = useState<Record<ShortcutAction, ShortcutBinding>>(() => loadShortcuts());

  const handlersRef = React.useRef<Map<ShortcutAction, Set<() => void>>>(new Map());

  const setBinding = useCallback((action: ShortcutAction, binding: ShortcutBinding) => {
    setBindings((prev) => {
      const next = { ...prev, [action]: binding };
      saveShortcuts(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    clearShortcuts();
    setBindings({ ...DEFAULT_SHORTCUTS });
  }, []);

  const subscribe = useCallback((action: ShortcutAction, handler: () => void) => {
    const map = handlersRef.current;
    let set = map.get(action);
    if (!set) {
      set = new Set();
      map.set(action, set);
    }
    set.add(handler);
    return () => {
      const s = map.get(action);
      if (!s) return;
      s.delete(handler);
      if (s.size === 0) map.delete(action);
    };
  }, []);

  // Single global keydown listener that dispatches to subscribed handlers based on current bindings.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      // Iterate bindings and find first match with a subscriber.
      for (const action of Object.keys(bindings) as ShortcutAction[]) {
        const b = bindings[action];
        if (!matchesBinding(e, b)) continue;
        const subs = handlersRef.current.get(action);
        if (subs && subs.size > 0) {
          e.preventDefault();
          subs.forEach((h) => h());
          return;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bindings]);

  const value = useMemo<ShortcutsContextValue>(
    () => ({ bindings, setBinding, resetAll, subscribe }),
    [bindings, setBinding, resetAll, subscribe],
  );

  return <ShortcutsContext.Provider value={value}>{children}</ShortcutsContext.Provider>;
}

export function useShortcuts() {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error('useShortcuts must be used within ShortcutsProvider');
  return ctx;
}

// Convenience: register a single action handler.
export function useShortcutAction(action: ShortcutAction, handler: () => void, enabled = true) {
  const { subscribe } = useShortcuts();
  // Keep latest handler in a ref to avoid resubscribing on every render.
  const handlerRef = React.useRef(handler);
  useEffect(() => { handlerRef.current = handler; }, [handler]);

  useEffect(() => {
    if (!enabled) return;
    return subscribe(action, () => handlerRef.current());
  }, [action, enabled, subscribe]);
}
