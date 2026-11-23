# DevFlow device mockups

Presentation-ready PNGs of DevFlow in original, unbranded laptop and phone frames. Frames are rendered in HTML/CSS around actual application captures; the UI text and colors are preserved. Mock data is fictional.

## Files

- `desktop/light/` and `desktop/dark/`: laptop compositions, 1800 × 1260 pixels.
- `mobile/light/` and `mobile/dark/`: phone compositions, 1100 × 1260 pixels.
- `paired/light/` and `paired/dark/`: laptop and phone together for the landing page, dashboard, projects, project overview, documentation, snippets, files, and settings. 1800 × 1260 pixels.
- `manifest.json`: filenames, output dimensions, devices, themes, and source references.

Pages keep their descriptive filenames, for example `project-overview.png` and `project-documentation.png`. Light mockups have a light gray background; dark mockups have a charcoal background.

Desktop views are captured afresh at 1440 × 900, then scaled uniformly inside the laptop. Mobile views use 390 × 844 inside a phone with separate status and home bars. Long pages show the corresponding viewport rather than squeezing an entire scrolling page into a screen. The original full-page screenshots remain in `../screenshots/`.

## Regenerate

From the repository root:

```sh
npm run mockups --prefix client
```

Requires installed client dependencies, local Google Chrome, and free port 5178. A temporary local server captures the application with intercepted mock API responses. It closes before the device compositions render. Temporary source captures are cleaned up afterward; original screenshot assets and application data remain unchanged.

To generate a small preview set:

```sh
npm run mockups --prefix client -- --only=landing,dashboard
```

A filtered run replaces the manifest with that run's inventory. Run the command without `--only` for a complete inventory.
