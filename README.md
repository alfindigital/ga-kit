# GAKit – Free Ads Toolkit for Google Advertisers

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-teal?logo=tailwindcss)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-ready-orange)](https://web.dev/progressive-web-apps/)

> A free, open-source Progressive Web App (PWA) toolkit for Google Advertisers. No signup, no backend, no data sent anywhere — everything runs locally in your browser.

---

## Features

| Tool | Description |
|------|-------------|
| **UTM Builder** | Build campaign tracking URLs with UTM parameters + QR code export |
| **QR Generator** | Generate QR codes for any URL with customisation options |
| **Keyword Combiner** | Combine keyword lists across match types (Broad, Phrase, Exact) |
| **Keyword Mixer** | Mix and permute keyword sets for expanded coverage |
| **Keyword Tools** | Additional keyword utilities and analysis helpers |
| **Negative Keywords** | Build and manage negative keyword lists |
| **Ad Copy Validator** | Validate ad headlines & descriptions against Google Ads character limits |
| **Headline Analyzer** | Analyse ad headlines for quality and policy compliance |
| **ROAS Calculator** | Calculate Return on Ad Spend and break-even metrics |
| **URL Validator** | Bulk-validate destination URLs for errors & redirects |
| **URL History** | View history of previously validated/built URLs |
| **YouTube Finder** | Find YouTube channel/video IDs for targeting |

### App-level features
- 🌙 Dark / Light theme toggle
- 🌍 Internationalisation (i18n) support
- 🔠 Font-size accessibility settings
- ⌨️ Keyboard shortcuts
- 📱 Installable PWA (works offline after first load)

---

## Quick Start

### Prerequisites
- Node.js ≥ 18 or [Bun](https://bun.sh)
- npm / bun

### Install & run

```bash
# 1. Clone the repo
git clone https://github.com/alfindigital/ga-kit.git
cd ga-kit

# 2. Install dependencies
npm install
# or
bun install

# 3. Start dev server (http://localhost:8080)
npm run dev
# or
bun run dev
```

### Build for production

```bash
npm run build
# Output is in /dist — deploy to any static host (Vercel, Netlify, GitHub Pages, etc.)
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Project Structure

```
ga-kit/
├── public/            # Static assets (icons, og-image, offline.html)
├── src/
│   ├── components/    # Reusable UI components (layout, shadcn/ui wrappers)
│   ├── contexts/      # React contexts: Theme, FontSize, Language, Shortcuts
│   ├── hooks/         # Custom React hooks
│   ├── i18n/          # Translation files
│   ├── lib/           # Utility library functions
│   ├── pages/         # Route-level page components (one per tool)
│   └── utils/         # Pure utility functions
├── index.html         # App entry point with CSP & PWA meta
├── vite.config.ts     # Vite + PWA plugin configuration
├── tailwind.config.ts # Tailwind CSS configuration
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| State | TanStack Query v5 |
| Charts | Recharts |
| QR codes | qrcode |
| Excel export | ExcelJS |
| PWA | vite-plugin-pwa (Workbox) |

---

## Configuration (Optional)

GAKit is fully client-side — no environment variables are required for local development.

If you fork and deploy to a custom domain, update the OG/Twitter meta tags in [`index.html`](index.html) with your own URL and image path.

Copy `.env.example` to `.env` for any optional build-time settings:

```bash
cp .env.example .env
```

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your branch: `git checkout -b feat/my-feature`
3. Commit with [Conventional Commits](https://www.conventionalcommits.org): `git commit -m "feat: add new tool"`
4. Push and open a Pull Request

---

## Security

Please read [SECURITY.md](SECURITY.md) for responsible disclosure guidelines.

---

## License

MIT © 2026 contributors — see [LICENSE](LICENSE).
