# System Patterns

- **Architecture**: App Router with `app/layout.tsx` providing the root HTML shell and `app/page.tsx` delivering the landing content. The `next.config.ts` enforces `output: 'export'` and derives `basePath` from `PAGES_BASE_PATH` so the static export matches GitHub Pages subdirectory routing.
- **Build pipeline**: GitHub Actions workflow defined in `.github/workflows/deploy.yml` runs on pushes to `main` (plus manual dispatch), installs dependencies with `pnpm`, builds with `pnpm run build`, exports to `./out`, uploads the artifact, and finally publishes via `actions/deploy-pages@v4`.
- **Deployment constraints**: GitHub Pages serves from the exported `out/` directory, so all dynamic logic must run at build time; caching uses `actions/cache` to persist `.next/cache` keyed on `pnpm-lock.yaml` and source files.
- **Patterns to follow**: Keep components lean, pre-render everything statically, and document any future base path additions so `next.config.ts` and workflow env remain in sync.
