# Tech Context

- **Frameworks & language**: Built with Next.js 15 (App Router) and React 19 using TypeScript; Node.js 22 runtime in GitHub Actions.
- **Package management**: `pnpm` for dependency installation, with `pnpm-lock.yaml` tracking versions.
- **UI Framework**: Tailwind CSS for styling with shadcn/ui component library for consistent, accessible UI elements (dialogs, tooltips, cards).
- **Drag & Drop**: Will use @dnd-kit library for accessible, touch-friendly drag-and-drop functionality on both desktop and mobile.
- **Build configuration**: `next.config.ts` sets `output: 'export'` with `PAGES_BASE_PATH` for GitHub Pages subdirectory routing.
- **Deployment tooling**: GitHub Actions workflow deploys static export to GitHub Pages on every push to `main`.
