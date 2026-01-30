# Product Context

- **Why it exists**: Developers need a zero-config path to publish Next.js App Router projects on GitHub Pages so documentation, marketing, or personal sites stay in sync with the repo without extra infrastructure.
- **Problem solved**: GitHub Pages only serves static output, and Next.js defaults to hybrid server-side behavior; this setup forces `output: 'export'`, wires `PAGES_BASE_PATH`, and leans on GitHub Actions so the site stays compatible with GitHub Pages constraints.
- **Expected behavior**: Authors push to `main`, GitHub Actions builds the export, and GitHub Pages serves the static files under the repository’s `<user>.github.io/<repo>/` path with HTTPS enabled.
