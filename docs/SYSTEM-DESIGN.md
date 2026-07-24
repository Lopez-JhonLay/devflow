# System Design Document (SDD)

# DevFlow v1

**Version:** 1.1  
**Status:** Approved  
**Last Updated:** July 24, 2026

---

# 1. Purpose

This document defines the technical architecture for DevFlow Version 1.

It describes the system components, architecture decisions, data flow, security considerations, deployment strategy, and scalability plans required to implement the MVP.

This document serves as the primary technical reference for development and complements the Product Requirements Document (PRD).

---

# 2. System Overview

DevFlow is a personal developer workspace that enables developers to manage projects, documentation, reusable code snippets, and project assets within a centralized platform.

The system follows a client-server architecture composed of:

- React Frontend
- NestJS Backend API
- PostgreSQL Database (NeonDB)
- Cloudinary Storage

The frontend communicates with the backend through REST APIs, while session management is offloaded to Better Auth seamlessly running alongside the database.

---

# 3. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query (Configured with `credentials: 'include'`)
- React Hook Form
- Zod

## Backend

- NestJS
- TypeScript
- Prisma ORM
- Better Auth NestJS Integration (Middleware layer)
- class-validator

## Database

- PostgreSQL
- NeonDB

## Cloud Storage

- Cloudinary

## Authentication

- Better Auth Ecosystem (Email & Password, Google OAuth, GitHub OAuth)
- Secure HttpOnly, SameSite=None, Secure Session Cookies (Required for Vercel-to-Render cross-site transmission)

## Deployment

### Frontend

- Vercel

### Backend

- Railway or Render

### Database

- NeonDB

### Storage

- Cloudinary

---

# 4. High-Level Architecture

```text
┌──────────────────────────────┐
│        React Frontend        │
│    (Better Auth Client)      │
└──────────────┬───────────────┘
               │
               │ HTTPS + Cross-Origin Session Cookies (SameSite=None)
               │
┌──────────────▼───────────────┐
│         NestJS Backend       │
│  (Better Auth Server Context)│
└───────┬───────────┬──────────┘
        │           │
        │           │
        ▼           ▼
┌────────────┐ ┌──────────────┐
│ PostgreSQL │ │  Cloudinary  │
│ (NeonDB)   │ │ Direct Store │
└────────────┘ └──────────────┘
```

---

# 5. Architecture Principles

The architecture follows these core principles:

## Separation of Concerns

Each layer has a single responsibility.

- **Frontend:** Manages the UI components and user view states.
- **Backend:** Handles core business rules, calculations, and validations.
- **Database:** Ensures robust data relational persistence.
- **Cloudinary:** Operates as a highly optimized binary storage network.

## Modular Design

Features are organized into independent, isolated modules on both the client and server application instances.

## Scalability

The architecture provides flexible anchor hooks to support the future incorporation of:

- Team Workspaces
- AI Integrations
- Portfolio CMS publishing pipelines
- Real-time notification hubs
- Collaborative code editing spaces

## Security by Default

Authentication verification, route access guards, and individual resource ownership verification checks are implicitly enforced across all systemic interaction endpoints.

---

# 6. Frontend Architecture

## Overview

The frontend is responsible for managing:

- User Interface layout rendering
- Client form handling and state validation
- Network layer API communications
- Route Protection based on the Better Auth Client SDK state
- Global client application states

---

## Folder Structure

```text
src/
│
├── assets/
├── components/
│   ├── ui/
│   └── shared/
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── projects/
│   ├── snippets/
│   └── settings/
│
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── lib/
├── types/
├── utils/
└── main.tsx
```

---

## Feature-Based Architecture

Each standalone application capability maintains ownership over its respective sub-components, helper hooks, network service files, schemas, and custom type definitions.

```text
features/
└── projects/
    ├── components/
    ├── hooks/
    ├── services/
    ├── schemas/
    └── types/
```

---

## State Management

### Server State

Managed completely using **TanStack Query** to control response caching, background refetch cycles, network loading indicators, and global error catch handlers.

### Authentication State

Leverages the real-time context and secure hooks provided out-of-the-box by the **Better Auth Client SDK**.

### Global UI State

Managed with lightweight **Zustand** stores to track visual components like sidebar toggles or dark mode preferences.

---

## API Client Configuration

Because the Frontend (Vercel) and Backend (Render) exist on separate root domains, the global HTTP/fetch client (Axios or native fetch wrapper) **must** be explicitly initialized with:

```typescript
credentials: 'include';
```

This forces the browser to attach cross-site HttpOnly session cookies to all outgoing API requests.

---

## Routing

### Protected Routes

```text
/dashboard
/projects
/projects/:id
/snippets
/settings
```

### Public Routes

```text
/login
/register
/forgot-password
```

---

# 7. Backend Architecture

## Overview

The backend serves as the authoritative boundary for data persistence and rule authorization.

Core responsibilities include:

- Processing session tokens via Better Auth server context interceptors
- Verifying strict resource authorization and structural user records ownership
- Validating request payloads prior to internal execution pipelines
- Executing database transactions
- Generating secure, direct-to-cloud file upload cryptographic signatures

---

## Folder Structure

```text
src/
│
├── auth/          # Better Auth initialization and Session Guards
├── users/
├── projects/
├── snippets/
├── uploads/       # Handles Secure Upload Signatures
├── settings/
│
├── prisma/
├── common/
├── config/
└── main.ts
```

---

## Layer Responsibilities

### Controllers

Expose clean network endpoints, parse input structures, enforce request DTO layout constraints, and return standard JSON outputs.

### Services

Contain the deterministic business logic rules, map entities, and orchestrate transactions.

### Prisma Layer

Manages type-safe query interfaces, structural schema modeling, and direct PostgreSQL database engine access.

---

# 8. Database Architecture

## Overview

PostgreSQL operates as the foundational data storage engine. The database schema maintains direct application structures alongside the native metadata tables auto-generated by the Better Auth layer (`User`, `Session`, `Account`, `Verification`).

## Application Entities

### Project

Houses core metadata details corresponding to individual development projects.

### Documentation

Contains the raw Markdown text data. It is kept isolated in its own related table to keep high-frequency document autosave transactions lightweight and fast.

### ProjectFile

Stores reference metadata information mapping to asset records uploaded onto Cloudinary.

### Snippet

Stores user-saved blocks of reusable syntax code.

### Tag

Enables text labels to be applied across projects or snippet categories. Relationships are mapped using separate native Many-to-Many relationships to align with Prisma ORM design patterns.

---

## Relationship Overview

```text
User ──── (1:N) ─── Projects ──── (1:1) ─── Documentation
 │                     │
 │                     ├─── (1:N) ─── ProjectFiles
 │                     │
 │                     └─── (M:N) ─── Tags (via ProjectTags)
 │
 └─────── (1:N) ─── Snippets ──── (M:N) ─── Tags (via SnippetTags)
```

---

# 9. Authentication Architecture

## Supported Methods

- Email & Password credentials validation
- Google Provider OAuth authentication link
- GitHub Provider OAuth authentication link

## Authentication Flow

```text
User ──> Frontend Interaction (Sign In)
             │
             ▼
    Better Auth Client SDK
             │
             ▼  (Direct Interception Request)
    Better Auth API Route handler (/api/auth/*)
             │
             ▼
    Verify with Identity Provider (OAuth / Local Passwords)
             │
             ▼
    Generate Secure Session Token -> Insert to Postgres
             │
             ▼
    Set HttpOnly, SameSite=None, Secure Cookie to Browser Window
             │
             ▼
    Frontend application routes are granted authenticated context
```

## Authorization & Ownership Protection

All API paths behind application authentication guards evaluate the session payload context. When any operations are requested against dynamic path records, the query strictly includes the authenticated `userId` context to ensure users can never interact with someone else's resources.

---

# 10. API Request Lifecycle

## Example: Create/Update Documentation (Debounced Autosave)

```text
User Types into Markdown Editor
 │
 ▼
Client-side Debounce Hook (Waits 1500ms)
 │
 ▼
Zod Schema Processing Check
 │
 ▼
PUT /projects/:id/documentation  (Includes Cross-Origin Cookies)
 │
 ▼
NestJS Route Controller Handler ──> Better Auth Guard Checks Session Valid
 │
 ▼
Service Layer Processes Entity Save
 │
 ▼
Prisma Updates Documentation Table
 │
 ▼
200 OK Response Standard returned to User UI
```

---

# 11. File Upload Architecture

To maximize server efficiency, heavy file streams bypass the NestJS server memory completely via secure client-side signed uploads.

## Upload Flow

```text
User selects File Asset -> Client checks size/type parameters
 │
 ▼
Frontend requests upload token: GET /uploads/sign
 │
 ▼
NestJS issues cryptographic Cloudinary Upload Signature token
 │
 ▼
Frontend posts binary payload directly to Cloudinary Endpoint using signature
 │
 ▼
Cloudinary replies back with secure Asset URL & public_id references
 │
 ▼
Frontend saves data record: POST /projects/:id/files { url, metadata }
 │
 ▼
NestJS updates ProjectFile structure via Prisma Engine
 │
 ▼
UI updates context successfully
```

---

## Validation Rules

### File Size

Maximum size allowed per individual file asset transaction: **10 MB**.

### Allowed MIME Types

- **Images:** `image/png`, `image/jpeg`, `image/webp`
- **Documents:** `application/pdf`
- **Diagrams:** `image/svg+xml`, `image/png`

---

# 12. Security Design

## Session Authentication

- Managed completely via the **Better Auth** ecosystem.
- Session tokens are strictly stored inside **HttpOnly, Secure, and SameSite=None** cookies. This cross-site configuration is mandatory to guarantee cookie context sharing between your custom Vercel and Render deployment endpoints.

## Input Verification

- **Client Application:** Enforced at the boundary form inputs using **Zod** schema layout maps.
- **Backend API:** Orchestrated at the entry gateway pipe using NestJS validation decorators powered by **class-validator**.

## Resource Allocation Boundary

Every database write or patch command implicitly executes an ownership match assertion clause against the incoming authenticated session ID to block access attempts across account profiles.

---

# 13. Error Handling

## Standard Success Response

```json
{
  "success": true,
  "data": {}
}
```

## Standard Error Response

```json
{
  "success": false,
  "message": "Project not found or user unauthorized"
}
```

## HTTP Status Codes Enforced

- **200 OK / 201 Created:** Successful action completion.
- **400 Bad Request:** Malformed payload parameters or failed schema validations.
- **401 Unauthorized:** Missing, corrupted, or expired session cookies.
- **403 Forbidden:** The user is authenticated but does not own the requested resource.
- **404 Not Found:** Entity does not exist within the active user profile records space.
- **500 Internal Error:** Unhandled code failures or infrastructure service communication faults.

---

# 14. Logging Strategy

The NestJS logging middleware intercepts and records:

- **API Requests:** Verb type, execution duration metrics, path parameters, and final status code responses.
- **System Exceptions:** Detailed error names, message metrics, and detailed execution stack traces.
- **Security Contexts:** Registration events, OAuth handshake linkages, and initialization anomalies.

---

# 15. Environment Variables

## Backend Configurations

```env
DATABASE_URL="postgresql://user:password@neon-db-host/devflow?sslmode=require"

BETTER_AUTH_SECRET="super-secure-cryptographic-hash-value"
BETTER_AUTH_URL="[https://devflow-api.onrender.com](https://devflow-api.onrender.com)"

GOOGLE_CLIENT_ID="google-apps-oauth-client-id"
GOOGLE_CLIENT_SECRET="google-apps-oauth-client-secret"

GITHUB_CLIENT_ID="github-developer-oauth-client-id"
GITHUB_CLIENT_SECRET="github-developer-oauth-client-secret"

CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

## Frontend Configurations

```env
VITE_API_URL="[https://devflow-api.onrender.com](https://devflow-api.onrender.com)"
```

---

# 16. Deployment Architecture

- **Client Interface App:** Built as an optimized bundle deployed to the **Vercel Edge Platform**.
- **API Application Instance:** Containerized and hosted using continuous web service runtimes on **Render**.
- **Relational Engine:** Managed serverless PostgreSQL instances supplied on **NeonDB**.
- **Asset Distribution:** Static binary image and document storage served worldwide through **Cloudinary CDN**.

---

# 17. Architecture Decisions

| Component Selection             | Practical Engineering Reason                                                                                                                                      |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React + Vite**                | Provides sub-second bundle compilation, lightning-fast hot module replacement, and a lightweight runtime footprint.                                               |
| **NestJS + Prisma**             | Implements rigid structural patterns out-of-the-box that ensure code readability alongside strict type-safe database queries.                                     |
| **Better Auth**                 | Standardizes enterprise-grade session lifecycle security natively inside HttpOnly cookies, removing the burden of rolling custom JWT rotation storage mechanisms. |
| **Isolated Docs Entity**        | Segregates document text fields from core project arrays, ensuring debounced autosave network commands write efficiently without loading project metadata loops.  |
| **Presigned Direct Uploads**    | Prevents concurrent file uploads from choking server runtime execution threads or causing runtime memory leaks on host endpoints.                                 |
| **SameSite=None Configuration** | Explicitly bypasses browser cross-site tracking protections to allow smooth authentication flow between independent Vercel and Render tracking domains.           |
