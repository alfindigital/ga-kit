# Security Policy

## Supported Versions

GAKit is a client-side-only application. The latest version on the `main` branch is actively maintained.

| Version | Supported |
|---------|-----------|
| latest (main) | ✅ |
| older branches | ❌ |

## Scope

Because GAKit runs entirely in the browser with no backend server, the attack surface is limited to:

- **XSS vulnerabilities** in UI rendering or DOM manipulation
- **Malicious input handling** in URL/keyword tools
- **Dependency vulnerabilities** in npm packages
- **CSP bypass** via Content Security Policy misconfigurations

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not open a public GitHub issue**.

Instead, report it responsibly:

1. Open a [GitHub Security Advisory](https://github.com/alfindigital/ga-kit/security/advisories/new) (private disclosure)
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fix (optional)

We will acknowledge your report within **48 hours** and aim to release a fix within **14 days** for critical issues.

## Dependency Auditing

Run `npm audit` to check for known vulnerabilities in dependencies:

```bash
npm audit
npm audit fix  # to auto-fix where possible
```

## Thank You

We appreciate responsible disclosure and will credit researchers who report valid vulnerabilities (with their permission).
