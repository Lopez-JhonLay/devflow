# DevFlow screenshots

Product captures of the actual application using fictional local data. No backend, account, OAuth connection, database, or Cloudinary upload is needed.

## Organization

- `desktop/light/` and `desktop/dark/`: 1440 × 1080 viewport.
- `mobile/light/` and `mobile/dark/`: 390 × 844 viewport.
- Each filename describes the page or feature, such as `project-overview.png`, `project-documentation.png`, or `snippet-edit.png`.
- `manifest.json` maps every capture to its route, viewport, and theme.

Images use PNG at 1× pixel density. Public pages are captured at their full document height. Workspace pages preserve the real application layout and its internal scrolling; specific feature captures scroll to the relevant content. Modals preserve their actual scrolling behavior.

## Regenerate

From the repository root:

```sh
npm run screenshots --prefix client
```

Requires dependencies installed in `client/` and Google Chrome available locally. The script starts a temporary Vite server on `127.0.0.1:5178`, launches headless Chrome in isolated contexts, intercepts API calls with fixtures, writes the images, then closes the browser and server, including on failure. Port 5178 must be free. The normal development server does not need to run.

Mock data lives in `client/scripts/screenshot-fixtures.mjs`. Capture scenarios live in `client/scripts/capture-screenshots.mjs`. Production application code and authentication are unchanged by the capture setup.

Captures cover the landing page, sign in, sign up, password recovery request, dashboard, projects and archive filter, project creation and editing, overview, documentation editor, asset management, snippets and favorites, snippet creation and editing, files and diagram filter, settings, password settings, and the mobile navigation menu.

These images illustrate the implemented screens. They do not demonstrate completed OAuth, password recovery delivery, real uploads, or backend mutations.
