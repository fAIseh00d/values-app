# Tech Context

- **Frameworks & language**: Built with Next.js (App Router) and React using TypeScript; Node.js 22 runtime was selected in the workflow.
- **Package management**: `pnpm` powers dependency installation (configured via `pnpm-lock.yaml`), with `pnpm/action-setup@v4` in the workflow to install pnpm before running `pnpm install`.
- **Build configuration**: `next.config.ts` sets `output: 'export'` and picks up `process.env.PAGES_BASE_PATH` so the generated static assets honor the Pages deployment path.
- **Deployment tooling**: GitHub Actions uses `actions/configure-pages` to set up the Pages environment, `actions/upload-pages-artifact` to stage the `./out` folder, and `actions/deploy-pages` to push the finalized build to `github-pages`.
