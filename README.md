# DevFlow

DevFlow is a personal developer workspace for organizing software projects, Markdown documentation, reusable code snippets, and project assets in one place.

It is built for individual developers who want a focused workspace without jumping between notes apps, cloud drives, snippet files, and project trackers.

## Demo

Live app: [https://devflow-five-iota.vercel.app](https://devflow-five-iota.vercel.app)

## Features

- Secure authentication with email/password, Google OAuth, and GitHub OAuth
- Project CRUD with status, tags, repository URL, live URL, and cover image
- Markdown documentation editor with live preview and debounced autosave
- Direct Cloudinary uploads for images, PDFs, and diagrams
- Read-only asset library with file search and copy URL actions
- Snippet library with search, tags, syntax highlighting, copy, and favorites
- Settings page for profile, avatar, password, and theme preference
- Responsive dark/light UI

## Tech Stack

**Client:** React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, Zod

**Server:** NestJS, TypeScript, Prisma, Better Auth

**Infrastructure:** PostgreSQL/Neon, Cloudinary, Vercel, Render

## Project Structure

```txt
client/   React frontend
server/   NestJS API and Prisma schema
docs/     PRD, system design, and UI references
```

## Local Setup

Install dependencies:

```bash
npm install --prefix client
npm install --prefix server
```

Create `server/.env` with the required backend variables:

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Run the apps:

```bash
npm run start:dev --prefix server
npm run dev --prefix client
```

## Production Notes

The client expects:

```env
VITE_API_URL=https://your-api-domain.com
```

The server expects:

```env
BETTER_AUTH_URL=https://your-api-domain.com
CLIENT_URL=https://your-client-domain.com
TRUSTED_ORIGINS=https://your-client-domain.com
```

For SPA routing on Vercel, `client/vercel.json` rewrites all routes to `index.html`.

## Status

DevFlow v1 includes the core workspace experience: authentication, project management, documentation, uploads, snippets, settings, and production deployment configuration.
