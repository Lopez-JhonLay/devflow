# Product Requirements Document (PRD)

# DevFlow v1

**Version:** 1.0  
**Status:** Approved  
**Author:** Jhon Lay Lopez  
**Last Updated:** July 24, 2026

---

# 1. Overview

## Product Summary

DevFlow is a personal developer workspace that centralizes software development resources into a single application. It allows developers to organize projects, documentation, reusable code snippets, and project assets without relying on multiple disconnected tools.

The goal of **Version 1 (MVP)** is to provide a clean, fast, and production-ready workspace that developers can use every day to manage their personal software projects.

Rather than competing with large productivity platforms such as Notion or Jira, DevFlow focuses specifically on the needs of software developers by providing only the essential tools required to manage development projects.

---

# 2. Problem Statement

Developers frequently use multiple applications to manage different aspects of their work.

Examples include:

- Documentation stored in Notion or Obsidian
- Code snippets saved inside VS Code or random text files
- Screenshots uploaded to Google Drive
- Project information scattered across GitHub repositories
- Assets stored in various cloud storage providers

This fragmentation creates unnecessary friction when switching between projects and maintaining development resources.

DevFlow aims to become a centralized workspace where developers can manage everything related to their projects in one place.

---

# 3. Product Goals

## Primary Goals

- Provide a centralized workspace for personal software projects.
- Organize project documentation.
- Store reusable code snippets.
- Upload and manage project assets.
- Provide secure authentication using Email/Password, Google OAuth, and GitHub OAuth.
- Deliver a clean and responsive user experience.

## Non-Goals

The following features are intentionally excluded from Version 1:

- AI Assistant
- Team Collaboration
- Portfolio CMS
- Analytics Dashboard
- Public Project Sharing
- Mobile Application
- Global Search
- Real-time Collaborative Editing
- Task Management
- Calendar Integration

These features are planned for future versions.

---

# 4. Target Users

## Primary User

Individual software developers.

## User Persona

A developer working on multiple personal or freelance projects who wants a centralized place to organize documentation, reusable code, screenshots, and project information.

---

# 5. User Stories

## Authentication

- As a developer, I want to sign in securely so my workspace is protected.
- As a developer, I want to sign in using Google or GitHub to simplify authentication.

## Projects

- As a developer, I want to create projects so I can organize my work.
- As a developer, I want to update project information whenever my project changes.
- As a developer, I want to archive or delete projects I no longer need.

## Documentation

- As a developer, I want to write project documentation using Markdown.
- As a developer, I want documentation to stay attached to its project.

## File Uploads

- As a developer, I want to upload screenshots, diagrams, and PDFs for each project.
- As a developer, I want uploaded files stored securely in cloud storage.

## Snippets

- As a developer, I want to save reusable code snippets.
- As a developer, I want to search and copy snippets quickly.

## Dashboard

- As a developer, I want a homepage showing my recent work so I can continue where I left off.

---

# 6. Scope

## Included

### Authentication

- Email & Password Authentication
- Google OAuth
- GitHub OAuth
- Session Management (Cookie-based via Better Auth)
- Protected Routes
- Forgot Password

### Dashboard

- Recent Projects
- Recent Snippets
- Recent Uploads
- Quick Actions

### Projects

- CRUD Operations
- Project Overview
- Repository URL
- Live URL
- Status
- Tags
- Cover Image

### Documentation

- Markdown Editor
- Markdown Preview
- Autosave functionality
- Single Documentation Page per Project

### File Management

- Upload Images
- Upload PDFs
- Upload Architecture Diagrams
- Cloud Storage
- File Metadata

### Snippets

- CRUD Operations
- Syntax Highlighting
- Copy Button
- Favorites
- Search
- Language Support
- Tags

### Settings

- Profile Information
- Avatar
- Password Change
- Connected Google Account
- Connected GitHub Account
- Theme Preference

## Excluded

- AI Features
- Team Collaboration
- Roles & Permissions
- Notifications Center
- Portfolio CMS
- Public API
- Activity Timeline
- Comments
- Real-time Collaboration
- Tasks
- Calendar
- Organizations

---

# 7. Functional Requirements

## 7.1 Authentication

### Description

Users must be able to securely access their personal workspace.

### Requirements

- Register with Email/Password
- Login
- Logout
- Google OAuth
- GitHub OAuth
- Forgot Password
- Persistent Authenticated Session
- Protected Routes

### Acceptance Criteria

- Unauthenticated users cannot access protected pages.
- Sessions persist securely across browser refreshes via HttpOnly cookies.
- Google and GitHub OAuth create or link user accounts seamlessly.
- Passwords are secure and never handled in plain text.

---

## 7.2 Dashboard

### Description

Provides a summary of the user's workspace.

### Requirements

Display:

- Recent Projects
- Recent Snippets
- Recent Uploads
- Quick Actions

### Acceptance Criteria

- Dashboard loads within two seconds under normal conditions.

---

## 7.3 Projects

### Description

Projects are the core entity of DevFlow.

### Project Fields

- Name
- Description
- Status
- Repository URL
- Live URL
- Tags
- Cover Image

### Requirements

- Create Project
- Update Project
- Delete Project
- Archive Project
- View Project

### Acceptance Criteria

- Changes are immediately reflected after saving.

---

## 7.4 Documentation

### Description

Each project contains a dedicated Markdown document.

### Requirements

- Markdown Editing
- Live Preview
- Autosave
- Basic Formatting
- Code Blocks

### Acceptance Criteria

- Documentation automatically saves without losing user content.
- The autosave mechanism uses a client-side debounce to optimize network payloads.

---

## 7.5 File Uploads

### Description

Users can upload project-related assets.

### Supported Files

- Images
- PDFs
- Architecture Diagrams

### Requirements

- Drag & Drop Upload
- Progress Indicator
- Delete File
- View File
- Download File

### Acceptance Criteria

- Files upload securely directly to cloud storage via signed URLs to save server resources.
- File metadata is successfully captured and stored in the database.

---

## 7.6 Snippets

### Description

Reusable code snippets.

### Fields

- Title
- Description
- Language
- Code
- Tags
- Favorite

### Requirements

- Create
- Edit
- Delete
- Copy
- Search
- Filter by Language
- Favorite

### Acceptance Criteria

- Users can locate and copy snippets quickly.

---

## 7.7 Settings

### Requirements

- Update Profile
- Upload Avatar
- Change Password
- Toggle Theme
- View Connected OAuth Providers

---

# 8. Non-Functional Requirements

## Performance

- Dashboard loads in under 2 seconds.
- Project pages load in under 3 seconds.
- File uploads display progress feedback.

## Security

- Secure, modern cookie-based session management via Better Auth.
- Input validation on both client and server layers.
- Granular resource ownership checking on all protected backend handlers.
- Secure direct cloud storage integration utilizing signed tokens.

## Reliability

- Graceful error handling.
- Retry failed uploads.
- Debounced autosave for documentation.

## Accessibility

- Keyboard navigation.
- Semantic HTML.
- Color contrast compliance.
- Screen reader-friendly forms.

## Responsiveness

The application should function correctly across desktop, tablet, and mobile browsers.

---

# 9. Success Metrics

Version 1 will be considered successful if users can:

- Create and manage software projects.
- Store project documentation.
- Upload project assets.
- Save reusable snippets.
- Authenticate securely.
- Navigate the application with minimal friction.

---

# 10. Future Enhancements

Potential Version 2+ features include:

- AI Assistant
- Portfolio CMS
- Real-time Notifications
- Team Collaboration
- Comments
- Activity Feed
- Full-text Search
- Version History
- API Integrations
- GitHub Synchronization
- Analytics Dashboard
- Public Portfolio Generation

---

# 11. Risks

| Risk                        | Mitigation                                                |
| :-------------------------- | :-------------------------------------------------------- |
| Authentication complexity   | Use Better Auth to offload handling framework edge-cases. |
| Cloud storage failures      | Validate uploads and implement retries.                   |
| Markdown editor integration | Choose a well-supported editor.                           |
| Scope creep                 | Strictly follow the defined MVP scope.                    |
| Performance degradation     | Optimize database queries and paginate data.              |

---

# 12. Milestones

## Phase 1 — Foundation

- Project setup
- Database schema & Better Auth integration
- UI framework

## Phase 2 — Core Features

- Dashboard
- Projects & Documentation Entities

## Phase 3 — File Management

- Cloudinary Upload Signature API
- Upload UI & Management

## Phase 4 — Snippets

- CRUD Operations
- Search & Favorites

## Phase 5 — Polish & Deployment

- Responsive UI
- Accessibility Improvements
- Testing & Bug Fixes
- Deployment

---

# 13. Technology Stack

## Frontend

- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- NestJS
- Prisma ORM

## Database

- PostgreSQL
- NeonDB (Managed PostgreSQL)

## Authentication

- Better Auth
- Email & Password
- Google OAuth
- GitHub OAuth

## Cloud Storage

- Cloudinary

## Validation

- Zod

---

# 14. Out of Scope

To maintain focus on the MVP, the following features are explicitly excluded:

- AI-generated documentation
- Organization workspaces
- Team invitations
- Public portfolios
- Messaging
- Live collaborative editing
- Advanced analytics
- Plugin system
- Mobile applications
- Offline support

---

# 15. Product Vision

DevFlow aims to become the central workspace for developers—a place where projects, documentation, reusable code, assets, and future developer tools coexist in a single, cohesive platform.

Version 1 establishes the foundation by delivering a focused, production-ready application centered on project organization. Future versions will expand the platform with collaboration, automation, AI-assisted workflows, and portfolio publishing while preserving the simplicity and developer-first experience introduced in the MVP.
