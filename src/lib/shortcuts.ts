// Custom keyboard shortcuts: action-id-based bindings with localStorage persistence.

export type ShortcutBinding = {
  key: string;            // single key, lowercase, e.g. 'k', '1', '?', '/'
  ctrl?: boolean;         // Ctrl OR Meta
  shift?: boolean;
  alt?: boolean;
};

export type ShortcutAction =
  // Global navigation
  | 'nav.dashboard'
  | 'nav.utmBuilder'
  | 'nav.qrGenerator'
  | 'nav.keywordCombiner'
  | 'nav.keywordMixer'
  | 'nav.keywordTools'
  | 'nav.ytFinder'
  | 'global.commandPalette'
  | 'global.showShortcuts'
  // Page actions
  | 'page.copy'
  | 'page.reset'
  | 'page.sample'
  | 'page.validate'
  | 'page.hashes'
  | 'page.fetch'
  | 'page.cancel';

export const SHORTCUT_GROUPS: { group: 'navigation' | 'pageActions'; actions: ShortcutAction[] }[] = [
  {
    group: 'navigation',
    actions: [
      'global.commandPalette',
      'nav.dashboard',
      'nav.utmBuilder',
      'nav.qrGenerator',
      'nav.keywordCombiner',
      'nav.keywordMixer',
      'nav.keywordTools',
      'nav.ytFinder',
      'global.showShortcuts',
    ],
  },
  {
    group: 'pageActions',
    actions: [
      'page.copy',
      'page.reset',
      'page.sample',
      'page.validate',
      'page.hashes',
      'page.fetch',
      'page.cancel',
    ],
  },
];

export const DEFAULT_SHORTCUTS: Record<ShortcutAction, ShortcutBinding> = {
  'nav.dashboard':         { key: '1', ctrl: true },
  'nav.utmBuilder':        { key: '2', ctrl: true },
  'nav.qrGenerator':       { key: '3', ctrl: true },
  'nav.keywordCombiner':   { key: '4', ctrl: true },
  'nav.keywordMixer':      { key: '5', ctrl: true },
  'nav.keywordTools':      { key: '6', ctrl: true },
  'nav.ytFinder':          { key: '7', ctrl: true },
  'global.commandPalette': { key: 'k', ctrl: true },
  'global.showShortcuts':  { key: '?' },
  'page.copy':             { key: 'c', shift: true },
  'page.reset':            { key: 'r', shift: true },
  'page.sample':           { key: 's', shift: true },
  'page.validate':         { key: 'v', shift: true },
  'page.hashes':           { key: 'h', shift: true },
  'page.fetch':            { key: 'f', shift: true },
  'page.cancel':           { key: 'x', shift: true },
};

// Translation key (matches src/i18n/translations.ts) for each action label.
export const ACTION_LABEL_KEYS: Record<ShortcutAction, string> = {
  'global.commandPalette': 'kbd.openCommandPalette',
  'nav.dashboard':         'kbd.dashboard',
  'nav.utmBuilder':        'nav.utmBuilder',
  'nav.qrGenerator':       'tool.qrGenerator',
  'nav.keywordCombiner':   'tool.keywordCombiner',
  'nav.keywordMixer':      'tool.keywordMixer',
  'nav.keywordTools':      'tool.keywordTools',
  'nav.ytFinder':          'tool.ytFinder',
  'global.showShortcuts':  'kbd.showShortcuts',
  'page.copy':             'kbd.copyResult',
  'page.reset':            'kbd.resetForm',
  'page.sample':           'kbd.loadSample',
  'page.validate':         'kbd.validateUrls',
  'page.hashes':           'kbd.generateHashes',
  'page.fetch':            'kbd.fetchData',
  'page.cancel':           'kbd.cancelRequest',
};

const STORAGE_KEY = 'ga-toolkit-shortcuts';

export function loadShortcuts(): Record<ShortcutAction, ShortcutBinding> {
  if (typeof window === 'undefined') return { ...DEFAULT_SHORTCUTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SHORTCUTS };
    const parsed = JSON.parse(raw) as Partial<Record<ShortcutAction, ShortcutBinding>>;
    return { ...DEFAULT_SHORTCUTS, ...parsed };
  } catch {
    return { ...DEFAULT_SHORTCUTS };
  }
}

export function saveShortcuts(bindings: Record<ShortcutAction, ShortcutBinding>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
}

export function clearShortcuts() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// Match a KeyboardEvent against a binding.
export function matchesBinding(e: KeyboardEvent, b: ShortcutBinding): boolean {
  // For "?" we tolerate "Shift+/" too (Playwright/keyboard-layout edge case).
  const eventKey = e.key.toLowerCase();
  const bindingKey = b.key.toLowerCase();

  let keyMatch = eventKey === bindingKey;
  if (!keyMatch && bindingKey === '?' && eventKey === '/' && e.shiftKey) {
    keyMatch = true;
  }
  if (!keyMatch) return false;

  const wantCtrl = !!b.ctrl;
  const hasCtrl = e.ctrlKey || e.metaKey;
  if (wantCtrl !== hasCtrl) return false;

  const wantShift = !!b.shift;
  // For "?" the user must press shift on most layouts, but binding doesn't store it.
  // Treat shift as wildcard when bindingKey === '?'.
  if (bindingKey !== '?' && wantShift !== e.shiftKey) return false;

  const wantAlt = !!b.alt;
  if (wantAlt !== e.altKey) return false;

  return true;
}

// Serialize a binding into a stable string used for conflict detection.
export function bindingSignature(b: ShortcutBinding): string {
  return [
    b.ctrl ? 'C' : '-',
    b.shift ? 'S' : '-',
    b.alt ? 'A' : '-',
    b.key.toLowerCase(),
  ].join(':');
}

export function findConflict(
  bindings: Record<ShortcutAction, ShortcutBinding>,
  candidate: ShortcutBinding,
  excludeAction: ShortcutAction,
): ShortcutAction | null {
  const sig = bindingSignature(candidate);
  for (const action of Object.keys(bindings) as ShortcutAction[]) {
    if (action === excludeAction) continue;
    if (bindingSignature(bindings[action]) === sig) return action;
  }
  return null;
}

// Format binding for UI display, e.g. ['Ctrl', 'K'].
export function formatBinding(b: ShortcutBinding): string[] {
  const parts: string[] = [];
  if (b.ctrl) parts.push('Ctrl');
  if (b.shift) parts.push('Shift');
  if (b.alt) parts.push('Alt');
  parts.push(formatKeyLabel(b.key));
  return parts;
}

export function formatKeyLabel(key: string): string {
  if (key === ' ') return 'Space';
  if (key.length === 1) return key.toUpperCase();
  // Named keys
  const map: Record<string, string> = {
    arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→',
    enter: 'Enter', escape: 'Esc', backspace: 'Backspace', tab: 'Tab',
    pageup: 'PgUp', pagedown: 'PgDn', home: 'Home', end: 'End',
  };
  return map[key.toLowerCase()] ?? key;
}

// Convert a raw KeyboardEvent into a candidate binding (used by capture editor).
export function eventToBinding(e: KeyboardEvent): ShortcutBinding | null {
  const k = e.key;
  // Ignore lone modifier presses.
  if (k === 'Control' || k === 'Shift' || k === 'Alt' || k === 'Meta') return null;
  return {
    key: k.length === 1 ? k.toLowerCase() : k.toLowerCase(),
    ctrl: e.ctrlKey || e.metaKey || undefined,
    shift: e.shiftKey || undefined,
    alt: e.altKey || undefined,
  };
}
