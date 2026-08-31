# Contributing to GAKit

Thank you for your interest in contributing! This guide covers everything you need to get started.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/ga-kit.git
   cd ga-kit
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Create** a new branch:
   ```bash
   git checkout -b feat/my-feature
   ```

---

## Branch Naming

| Prefix | Use for |
|--------|---------|
| `feat/` | New features or tools |
| `fix/` | Bug fixes |
| `docs/` | Documentation only changes |
| `refactor/` | Code refactoring (no feature/fix) |
| `chore/` | Build, CI, dependency updates |

Examples: `feat/bulk-url-checker`, `fix/utm-validation`, `docs/contributing-guide`

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<optional scope>): <description>

[optional body]

[optional footer]
```

Examples:
```
feat(utm-builder): add support for custom parameters
fix(qr-generator): correct SVG export encoding
docs: update README quick start section
```

---

## Pull Request Checklist

Before submitting a PR, make sure:

- [ ] Code builds without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] New components follow existing patterns (shadcn/ui, Tailwind)
- [ ] No hardcoded secrets, API keys, or personal data
- [ ] Meaningful PR title and description provided
- [ ] Related issue linked (if applicable)

---

## Code Style

- **TypeScript** — strict mode; avoid `any`
- **React** — functional components and hooks only
- **Tailwind** — use utility classes; avoid arbitrary values unless necessary
- **shadcn/ui** — prefer existing components before creating new ones

---

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs. actual behaviour
- Browser and OS

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
