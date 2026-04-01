

# PWA Enhancement Plan — GAKit

## Current State

GAKit already has `vite-plugin-pwa` installed and configured with:
- Manifest (name, icons, standalone display)
- Workbox with precaching and Google Fonts runtime caching
- PWA icons (192x192 and 512x512) in `/public`

**What's missing:**
1. Safety guards for Lovable preview/iframe (service worker breaks preview)
2. `devOptions: { enabled: false }` to prevent SW in dev mode
3. `navigateFallbackDenylist` for `/~oauth`
4. Install prompt UI (no way for users to trigger "Add to Home Screen")
5. Offline fallback page
6. i18n for install-related strings

## Plan

### Step 1 — Fix vite.config.ts PWA config

- Add `devOptions: { enabled: false }`
- Add `navigateFallbackDenylist: [/^\/~oauth/]` to workbox config

### Step 2 — Add iframe/preview guard in main.tsx

Add conditional logic to **unregister** service workers when running inside an iframe or on a Lovable preview host (`id-preview--*`, `lovableproject.com`). This prevents the SW from interfering with the editor preview.

### Step 3 — Create PWA Install hook (`useInstallPrompt`)

A custom hook that:
- Captures the `beforeinstallprompt` event
- Exposes `canInstall`, `isInstalled` (display-mode: standalone check), and `promptInstall()` method
- Detects iOS for manual install instructions

### Step 4 — Create Install Page (`/install`)

A dedicated page with:
- Install button (triggers native prompt on Android/Chrome)
- iOS manual instructions (Share → Add to Home Screen)
- Feature highlights (offline access, fast loading, no app store needed)
- Already-installed state detection
- Fully translated with `t()` keys

### Step 5 — Add install banner/button to Settings page

Add an "Install App" card in Settings that links to `/install` or triggers the prompt directly, so users discover the installability.

### Step 6 — Add translations

Add i18n keys for all install-related strings (EN & ID):
- `install.title`, `install.description`, `install.button`, `install.iosInstructions`, `install.alreadyInstalled`, `install.features.*`

### Step 7 — Add offline fallback

Configure workbox `offlineFallbackPage` or add a simple offline.html in `/public` so users see a branded page when offline and navigating to an uncached route.

---

**Important note:** PWA features (offline support, install prompt) will only work on the **published** version (`gakit.lovable.app`), not in the Lovable editor preview.

