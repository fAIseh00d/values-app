# Project Brief

- **Purpose**: Provide a Next.js App Router starter that can be published as a static site on GitHub Pages so contributors can ship feature-focused pages without managing a separate hosting provider.
- **Scope**: The repository contains a minimal Next.js app (`app/layout.tsx`, `app/page.tsx`) plus a GitHub Actions workflow that builds with `pnpm run build`, exports static assets via `next export`, and publishes them to GitHub Pages.
- **Goal**: Keep the site deployable via GitHub Pages with zero manual steps beyond pushing to `main`, while documenting the pattern for future maintainers.
