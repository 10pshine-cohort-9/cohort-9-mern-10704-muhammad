# Feature-Based Implementation Plan: NotesHub

**Version:** 2.0  
**Derived from:** NotesApp_PRD.md, NotesApp_TRD.md, NotesApp_Sprint_Breakdown.md, NotesApp_ERD.mermaid, openapi.yaml, TEST_PLAN.md, GIT_WORKFLOW.md  
**Architecture:** Layered (`Route → Middleware → Controller → Service → Repository → Mongoose Model`)  
**Workflow:** `main → feature/<area>/<name> → Pull Request to develop`  
**PR Size Constraint:** 300–800 lines of code per chunk for optimal CodeRabbit & mentor reviewability  

---

## Overview

This implementation plan breaks the **NotesHub** production MERN application into 11 independently reviewable, feature-focused implementation chunks. Each chunk corresponds to exactly **one feature branch** and **one Pull Request** targeting the `develop` branch.

---

## Implementation Chunks

---

### Chunk 01

#### Feature Name
Backend Project Setup

#### Branch Name
`feature/backend/project-setup`

#### Pull Request Title
`feat(backend): initialize Express backend foundation`

#### Goal
Establish the backend core application structure, Zod-validated environment handling, Pino structured logger, base custom error hierarchy, and standard HTTP response shaping.

#### Why this chunk exists
All subsequent backend modules depend on a shared server foundation, error classes, logging, environment variables, and middleware utilities.

#### Dependencies
- None

#### Scope
- Initialize Express server with standard middleware (`express.json`, `cors`, `cookie-parser`).
- Configure Zod environment variable parsing (`config/env.js`).
- Configure Pino logger with sensitive data redactions (`logger/index.js`).
- Implement base `AppError` and subclasses (`AuthError`, `NotFoundError`, `ConflictError`, `ValidationError`, `BadRequestError`).
- Implement `asyncHandler` wrapper and standardized `sendSuccess`/`sendError` response helpers.
- Implement global error handling middleware.

#### Deliverables
- [ ] Express server initialization (`src/app.js`, `src/index.js`)
- [ ] Zod environment schema (`src/config/env.js`)
- [ ] Pino logger configuration (`src/logger/index.js`)
- [ ] Custom error classes (`src/common/errors/index.js`)
- [ ] Utilities: `asyncHandler.js`, `response.js`
- [ ] Middleware: `errorHandler.js`, `validate.js`
- [ ] Health check endpoint (`GET /api/v1/health`)

#### Files/Folders Expected
```text
/backend
  package.json
  .gitignore
  src/
    config/env.js
    logger/index.js
    common/
      errors/index.js
      utils/asyncHandler.js
      utils/response.js
      middleware/errorHandler.js
      middleware/validate.js
    app.js
    index.js
```text

#### Acceptance Criteria
- Server starts cleanly on configured `PORT`.
- Missing environment variables cause immediate process failure with informative Zod error messages.
- `GET /api/v1/health` returns `200 OK` with JSON standard response envelope `{ success: true, data: { status: "UP" } }`.
- Throwing any `AppError` subclass in a route produces standardized JSON output with proper status codes.

#### Testing Checklist
- [ ] Unit test: `AppError` subclasses output correct status codes and error formats.
- [ ] Integration test: `GET /api/v1/health` returns 200 OK.
- [ ] Integration test: Unknown route returns 404 with standardized error envelope.

#### Definition of Done
- Feature implemented and verified.
- Tests passing via `npm test`.
- Zero lint errors.
- CodeRabbit HIGH and CRITICAL issues resolved.

---

### Chunk 02

#### Feature Name
Backend Authentication Module

#### Branch Name
`feature/backend/authentication`

#### Pull Request Title
`feat(backend): implement auth module with JWT and rate limiting`

#### Goal
Implement the complete, production-grade authentication module including registration, bcrypt password hashing, login, httpOnly cookie refresh tokens, token revocation, profile lookup, and password reset flows.

#### Why this chunk exists
User accounts and identity context must exist before any user-owned resources (notes, folders, tags, attachments) can be created or accessed.

#### Dependencies
- Depends on: Chunk 01 (Backend Project Setup)

#### Scope
- Mongoose `User` model with password select exclusion and indexes.
- Data repository (`auth.repository.js`) returning plain JS objects (`.lean()`).
- Zod validation schemas (`auth.schema.js`).
- Business logic service factory (`auth.service.js`) handling bcrypt hashing, JWT access/refresh token creation, session revocation via `refreshTokenVersion`, and reset tokens.
- Controller (`auth.controller.js`) managing httpOnly cookie setting and clear options.
- Auth middleware (`authGuard.js`) enforcing Bearer access token validation.
- Rate limiter (`authRateLimiter`) protecting auth endpoints.

#### Deliverables
- [ ] Mongoose User Model (`src/modules/auth/auth.model.js`)
- [ ] Auth Repository (`src/modules/auth/auth.repository.js`)
- [ ] Auth Validation Schemas (`src/modules/auth/auth.schema.js`)
- [ ] Auth Service (`src/modules/auth/auth.service.js`)
- [ ] Auth Controller (`src/modules/auth/auth.controller.js`)
- [ ] Auth Router (`src/modules/auth/auth.routes.js`)
- [ ] Auth Guard (`src/common/middleware/authGuard.js`)
- [ ] Auth Rate Limiter (`src/common/middleware/rateLimiter.js`)

#### Files/Folders Expected
```text
/backend/src/
  common/middleware/
    authGuard.js
    rateLimiter.js
  modules/auth/
    auth.model.js
    auth.repository.js
    auth.schema.js
    auth.service.js
    auth.controller.js
    auth.routes.js
/backend/tests/
  unit/auth/auth.service.test.js
  integration/auth.test.js
```text

#### Acceptance Criteria
- `POST /api/v1/auth/register` creates user with cost factor 12 bcrypt hash and returns access token + httpOnly refresh cookie.
- `POST /api/v1/auth/login` validates credentials (generic error on invalid user/password) and sets refresh cookie.
- `POST /api/v1/auth/logout` increments `refreshTokenVersion` and clears cookie.
- `POST /api/v1/auth/refresh` issues a new access token if refresh token version matches user record.
- `GET /api/v1/auth/me` returns authenticated user data when valid `Authorization: Bearer <token>` is supplied.
- Password reset endpoints process securely without revealing email existence.

#### Testing Checklist
- [ ] Unit tests (`auth.service.test.js`): mock repository tests for register, login, logout, refresh, resetPassword.
- [ ] Integration tests (`auth.test.js`): Supertest suite verifying 201/200/401/409/422 status codes and headers.

#### Definition of Done
- Auth module implemented cleanly without direct Mongoose calls in service or controllers.
- All 24 unit/integration tests passing.
- No sensitive keys/passwords logged or exposed in JSON responses.
- CodeRabbit HIGH and CRITICAL issues resolved.

---

### Chunk 03

#### Feature Name
Backend Folders and Tags Management

#### Branch Name
`feature/backend/folders-tags`

#### Pull Request Title
`feat(backend): implement folders and tags APIs`

#### Goal
Implement hierarchical folder management (supporting parent-child relationships) and tag organization for notes.

#### Why this chunk exists
Notes require folder and tag references during creation and update operations.

#### Dependencies
- Depends on: Chunk 01, Chunk 02

#### Scope
- Mongoose `Folder` model (`name`, `color`, `parentId`, `userId`) and `Tag` model (`name`, `color`, `userId`).
- Folder and Tag repositories with strict ownership scoping.
- Folder tree build algorithm in `folders.service.js` for recursive hierarchy rendering.
- Zod DTO schemas for Folder and Tag requests.
- Controllers and routes protected by `authGuard`.

#### Deliverables
- [ ] Mongoose Models (`folders.model.js`, `tags.model.js`)
- [ ] Repositories (`folders.repository.js`, `tags.repository.js`)
- [ ] Services (`folders.service.js`, `tags.service.js`)
- [ ] Controllers (`folders.controller.js`, `tags.controller.js`)
- [ ] Routes (`folders.routes.js`, `tags.routes.js`)

#### Files/Folders Expected
```text
/backend/src/modules/
  folders/
    folders.model.js
    folders.repository.js
    folders.schema.js
    folders.service.js
    folders.controller.js
    folders.routes.js
  tags/
    tags.model.js
    tags.repository.js
    tags.schema.js
    tags.service.js
    tags.controller.js
    tags.routes.js
```text

#### Acceptance Criteria
- `GET /api/v1/folders/tree` returns complete nested tree structure for current user.
- Folder creation validates parent folder existence and user ownership.
- Deleting a folder handles orphan child notes gracefully.
- Tags are uniquely scoped per user.

#### Testing Checklist
- [ ] Unit tests for folder tree construction and circular reference prevention.
- [ ] Integration tests for CRUD operations on `/folders` and `/tags`.

#### Definition of Done
- Layered architecture strictly followed.
- All unit and integration tests passing.
- CodeRabbit issues resolved.

---

### Chunk 04

#### Feature Name
Backend Notes Core & Full-Text Search

#### Branch Name
`feature/backend/notes-core`

#### Pull Request Title
`feat(backend): implement notes CRUD, search, and pagination`

#### Goal
Implement note creation, retrieval, updates, soft deletion, pinning, archiving, full-text search index queries, and paginated listings.

#### Why this chunk exists
Notes form the core domain model of NotesHub.

#### Dependencies
- Depends on: Chunk 01, Chunk 02, Chunk 03

#### Scope
- Mongoose `Note` model with text indexes on `title` and `contentPlainText`.
- Note repository implementing lean queries, text search `$text`, regex fallbacks, folder/tag filters, and pagination.
- Note service enforcing ownership, auto-calculating `contentPlainText` from HTML, and handling pin/archive/trash status toggles.
- Zod schemas for note validation.
- Routes: `POST /notes`, `GET /notes`, `GET /notes/:id`, `PATCH /notes/:id`, `DELETE /notes/:id`, `POST /notes/:id/pin`, `POST /notes/:id/archive`, `POST /notes/:id/trash`.

#### Deliverables
- [ ] Note Model (`notes.model.js`)
- [ ] Note Repository (`notes.repository.js`)
- [ ] Note Schemas (`notes.schema.js`)
- [ ] Note Service (`notes.service.js`)
- [ ] Note Controller (`notes.controller.js`)
- [ ] Note Routes (`notes.routes.js`)
- [ ] Pagination helper (`src/common/utils/pagination.js`)

#### Files/Folders Expected
```text
/backend/src/
  common/utils/pagination.js
  modules/notes/
    notes.model.js
    notes.repository.js
    notes.schema.js
    notes.service.js
    notes.controller.js
    notes.routes.js
/backend/tests/
  unit/notes/notes.service.test.js
  integration/notes.test.js
```text

#### Acceptance Criteria
- Creating/updating notes auto-extracts `contentPlainText` for search indexing.
- `GET /api/v1/notes` supports filtering by `folderId`, `tagId`, `isPinned`, `isArchived`, `isTrashed`, and `search`.
- Pagination metadata includes `total`, `page`, `limit`, `totalPages`, `hasNextPage`, `hasPrevPage`.
- Accessing or modifying another user's note returns `404 Not Found`.

#### Testing Checklist
- [ ] Unit tests: text extraction, ownership validation, status state machine (active -> trashed/archived).
- [ ] Integration tests: CRUD routes, search queries, pagination limits.

#### Definition of Done
- Notes API complete and fully tested.
- Text search verified with Mongoose text indexes.
- CodeRabbit issues resolved.

---

### Chunk 05

#### Feature Name
Backend Attachments & Cloudinary Storage

#### Branch Name
`feature/backend/attachments`

#### Pull Request Title
`feat(backend): implement attachment upload and storage`

#### Goal
Provide file attachment upload capabilities for notes with Cloudinary integration, file type validation, and size restrictions.

#### Why this chunk exists
Allows rich media and document attachments to be associated with notes securely.

#### Dependencies
- Depends on: Chunk 01, Chunk 02, Chunk 04

#### Scope
- Multer middleware configuration for memory storage buffer.
- Cloudinary upload/delete service helper.
- Mongoose `Attachment` model (`noteId`, `userId`, `url`, `publicId`, `filename`, `mimeType`, `size`).
- Attachment repository, service, and controller.
- Endpoints: `POST /api/v1/notes/:noteId/attachments`, `DELETE /api/v1/attachments/:id`.

#### Deliverables
- [ ] Cloudinary config & utility (`src/config/cloudinary.js`)
- [ ] Attachment Model (`attachments.model.js`)
- [ ] Attachment Repository (`attachments.repository.js`)
- [ ] Attachment Service (`attachments.service.js`)
- [ ] Attachment Controller (`attachments.controller.js`)
- [ ] Attachment Routes (`attachments.routes.js`)

#### Files/Folders Expected
```text
/backend/src/
  config/cloudinary.js
  modules/attachments/
    attachments.model.js
    attachments.repository.js
    attachments.service.js
    attachments.controller.js
    attachments.routes.js
```text

#### Acceptance Criteria
- Upload rejects files exceeding size limits (max 10MB) or disallowed MIME types.
- Deleting an attachment removes it from Cloudinary and deletes the Mongoose record.
- Uploads verify note ownership before processing.

#### Testing Checklist
- [ ] Unit test: attachment service handling Cloudinary stubs.
- [ ] Integration test: multipart form upload route with fake file buffer.

#### Definition of Done
- File uploads work safely without blocking server loop.
- Memory handling audited for zero buffer leaks.
- CodeRabbit issues resolved.

---

### Chunk 06

#### Feature Name
Backend Background Processing & Trash Purge Worker

#### Branch Name
`feature/backend/background-jobs`

#### Pull Request Title
`feat(backend): implement BullMQ trash purge and export queues`

#### Goal
Implement background processing using BullMQ and Upstash Redis for automatic 30-day trash purging and asynchronous data export jobs.

#### Why this chunk exists
Automates soft-deleted item cleanup and long-running export tasks out-of-band.

#### Dependencies
- Depends on: Chunk 01, Chunk 04

#### Scope
- Upstash Redis connection helper (`src/config/redis.js`).
- BullMQ queue definitions (`trashPurge.queue.js`, `export.queue.js`).
- BullMQ worker definitions (`trashPurge.worker.js`).
- Scheduled cron job triggering daily trash purge for notes trashed > 30 days.

#### Deliverables
- [ ] Redis Config (`src/config/redis.js`)
- [ ] BullMQ Queues (`src/jobs/queues/trashPurge.queue.js`)
- [ ] BullMQ Workers (`src/jobs/workers/trashPurge.worker.js`)
- [ ] Scheduler task trigger (`src/jobs/scheduler.js`)

#### Files/Folders Expected
```text
/backend/src/
  config/redis.js
  jobs/
    queues/trashPurge.queue.js
    workers/trashPurge.worker.js
    scheduler.js
```text

#### Acceptance Criteria
- Trash purge worker correctly identifies notes where `trashedAt` is older than 30 days and permanently deletes them.
- Jobs execute idempotently without duplicating tasks on worker restart.
- Redis connection fails gracefully when offline in development/test.

#### Testing Checklist
- [ ] Unit test: worker processing mock jobs with date queries.
- [ ] Integration test: queue event dispatching.

#### Definition of Done
- Background queue initialized and tested.
- Worker error handlers logged via Pino.
- CodeRabbit issues resolved.

---

### Chunk 07

#### Feature Name
Frontend Vite & Design Tokens Setup

#### Branch Name
`feature/frontend/project-setup`

#### Pull Request Title
`feat(frontend): initialize Vite React app with design tokens`

#### Goal
Scaffold the React frontend application using Vite, establish global CSS variables from design tokens and `stitch_noteshub_ui_design_system`, set up typography, Lucide icons, and base API client.

#### Why this chunk exists
Establishes the design system, global styles, and HTTP client before building user-facing pages.

#### Dependencies
- Depends on: Chunk 01

#### Scope
- Vite + React SPA initialization.
- Import design tokens (`design-tokens.css`) and global CSS variables from `stitch_noteshub_ui_design_system/precision_minimalist/code.html`.
- Axios/Fetch API wrapper with automatic Bearer token injection and 401 refresh interceptor.
- Layout shells: Navbar, Sidebar, Toast notifications container.

#### Deliverables
- [ ] Frontend setup (`frontend/package.json`, `vite.config.js`, `index.html`)
- [ ] CSS Design System (`src/index.css`, `src/styles/tokens.css`)
- [ ] API Client (`src/api/client.js`)
- [ ] Base Component Shells (`src/components/layout/Navbar.jsx`, `Sidebar.jsx`)

#### Files/Folders Expected
```text
/frontend
  package.json
  vite.config.js
  index.html
  src/
    api/client.js
    components/layout/
      Navbar.jsx
      Sidebar.jsx
    styles/tokens.css
    index.css
    main.jsx
    App.jsx
```text

#### Acceptance Criteria
- App renders dark-mode themed application shell matching design tokens and `stitch_noteshub_ui_design_system`.
- API client automatically attaches `Authorization: Bearer <accessToken>` from memory state.
- Interceptor handles `401 Unauthorized` by attempting token refresh via `/api/v1/auth/refresh`.

#### Testing Checklist
- [ ] Component test: Layout component rendering.
- [ ] Integration test: API client request interceptor injection.

#### Definition of Done
- Clean build via `npm run build`.
- Zero console warnings or lint errors.
- CodeRabbit issues resolved.

---

### Chunk 08

#### Feature Name
Frontend Authentication & Route Guards

#### Branch Name
`feature/frontend/authentication`

#### Pull Request Title
`feat(frontend): implement login, register, reset password, and auth state`

#### Goal
Build authentication user interfaces (Register, Login, Forgot Password, Reset Password) using exact HTML/CSS designs from `stitch_noteshub_ui_design_system/` (`login`, `register`, `forgot_password`, `reset_password`), integrated with Auth Context and protected route guards.

#### Why this chunk exists
Users must be able to authenticate in the UI before accessing protected note dashboards.

#### Dependencies
- Depends on: Chunk 02, Chunk 07

#### Scope
- `AuthContext` provider managing user state, access token in memory, and silent refresh on app load.
- Protected Route (`ProtectedRoute.jsx`) and Guest Route wrappers.
- Auth Pages (`Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`) faithfully converted from `stitch_noteshub_ui_design_system/` (`login/code.html`, `register/code.html`, `forgot_password/code.html`, `reset_password/code.html`).
- Form validation and accessible error feedback.

#### Deliverables
- [ ] Auth Context (`src/context/AuthContext.jsx`)
- [ ] Route Guards (`src/components/auth/ProtectedRoute.jsx`)
- [ ] Auth Pages (`src/pages/Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`) based on `stitch_noteshub_ui_design_system`

#### Files/Folders Expected
```text
/frontend/src/
  context/AuthContext.jsx
  components/auth/ProtectedRoute.jsx
  pages/
    Login.jsx
    Register.jsx
    ForgotPassword.jsx
    ResetPassword.jsx
```text

#### Acceptance Criteria
- UI matches the layout, dark-mode styling, and typography of `stitch_noteshub_ui_design_system` screens.
- User can register, log in, view validation errors, and log out cleanly.
- Navigating to `/dashboard` while logged out redirects to `/login`.
- Refreshing the browser preserves session via silent cookie refresh.

#### Testing Checklist
- [ ] UI Form Validation testing for email and password fields.
- [ ] End-to-end user login flow simulation.

#### Definition of Done
- Auth UI responsive and styled according to `stitch_noteshub_ui_design_system`.
- All auth forms pass error validation checks.
- CodeRabbit issues resolved.

---

### Chunk 09

#### Feature Name
Frontend Tiptap Editor & Dashboard Shell

#### Branch Name
`feature/frontend/notes-editor`

#### Pull Request Title
`feat(frontend): implement note editor, autosave, and dashboard shell`

#### Goal
Implement the main Notes Dashboard, Tiptap rich-text editor, note list sidebar, debounced autosave, pin/archive/trash actions, and full note lifecycle controls using exact designs from `stitch_noteshub_ui_design_system/` (`dashboard`, `note_editor`, `note_editor_with_attachments`, `archive`, `trash`, `profile_settings`).

#### Why this chunk exists
Represents the primary workspace experience for users creating and editing notes.

#### Dependencies
- Depends on: Chunk 04, Chunk 08

#### Scope
- Tiptap editor integration matching `stitch_noteshub_ui_design_system/note_editor/code.html`.
- Debounced autosave mechanism (save after 1.5s idle) with status indicator (`Saved`, `Saving...`, `Error`).
- Note list sidebar with active selection state matching `stitch_noteshub_ui_design_system/notes_list/code.html`.
- Quick actions: Pin toggle, Archive, Trash note, Duplicate note.

#### Deliverables
- [ ] Tiptap Editor (`src/components/editor/NoteEditor.jsx`)
- [ ] Editor Toolbar (`src/components/editor/EditorToolbar.jsx`)
- [ ] Note List (`src/components/notes/NoteList.jsx`, `NoteCard.jsx`)
- [ ] Dashboard Page (`src/pages/Dashboard.jsx`)
- [ ] Autosave hook (`src/hooks/useAutosave.js`)

#### Files/Folders Expected
```text
/frontend/src/
  components/
    editor/
      NoteEditor.jsx
      EditorToolbar.jsx
    notes/
      NoteList.jsx
      NoteCard.jsx
  hooks/
    useAutosave.js
  pages/
    Dashboard.jsx
```text

#### Acceptance Criteria
- Dashboard matches `stitch_noteshub_ui_design_system` visual layout and dark theme.
- Typing in editor triggers debounced autosave request to `PATCH /api/v1/notes/:id`.
- Status indicator accurately reflects `Saving...` and `Saved` states.
- Pinning a note immediately moves it to the top Pinned section.
- Trashing a note removes it from active list with undo toast notification.

#### Testing Checklist
- [ ] Unit test: `useAutosave` hook debounce timing.
- [ ] Component test: Note card rendering and action triggers.

#### Definition of Done
- Smooth rich text editing without lag or caret jumps.
- Autosave verified against backend notes API.
- CodeRabbit issues resolved.

---

### Chunk 10

#### Feature Name
Frontend Organization & Search UI

#### Branch Name
`feature/frontend/organization-search`

#### Pull Request Title
`feat(frontend): implement folder tree, tag chips, and search filtering`

#### Goal
Implement folder navigation tree, tag management modal, real-time debounced full-text search bar with match highlighting, and filter controls using exact designs from `stitch_noteshub_ui_design_system/` (`folders_tags`, `search_results`).

#### Why this chunk exists
Enables users to organize notes into folders/tags and instantly search through large note collections.

#### Dependencies
- Depends on: Chunk 03, Chunk 04, Chunk 09

#### Scope
- Sidebar Folder Tree component (`FolderTree.jsx`) matching `stitch_noteshub_ui_design_system/folders_tags/code.html`.
- Tag selection dropdown & tag chip list (`TagSelector.jsx`).
- Search input bar (`SearchBar.jsx`) with 300ms debounce matching `stitch_noteshub_ui_design_system/search_results/code.html`.
- Filter toolbar: Filter by folder, tag, pinned status, archive status, trash status.
- Highlight search term matches in note preview snippets.

#### Deliverables
- [ ] Folder Tree Component (`src/components/folders/FolderTree.jsx`)
- [ ] Tag Chips & Selector (`src/components/tags/TagSelector.jsx`)
- [ ] Search Bar & Filters (`src/components/search/SearchBar.jsx`, `FilterBar.jsx`)
- [ ] Search match highlighter utility (`src/utils/highlight.js`)

#### Files/Folders Expected
```text
/frontend/src/
  components/
    folders/FolderTree.jsx
    tags/TagSelector.jsx
    search/
      SearchBar.jsx
      FilterBar.jsx
  utils/highlight.js
```text

#### Acceptance Criteria
- Layout and components match `stitch_noteshub_ui_design_system` screens.
- Clicking a folder in sidebar filters note list to show notes belonging to that folder and its subfolders.
- Searching updates note list dynamically and highlights matched keywords.
- Tag selection filters active list immediately.

#### Testing Checklist
- [ ] Component test: Folder tree expanded/collapsed states.
- [ ] Unit test: Search term text highlighting utility.

#### Definition of Done
- Complete filtering and search flows verified against `stitch_noteshub_ui_design_system` UI specs.
- Responsive layout tested across desktop and tablet screen sizes.
- CodeRabbit issues resolved.

---

### Chunk 11

#### Feature Name
Deployment & GitHub Actions CI/CD

#### Branch Name
`feature/deployment`

#### Pull Request Title
`ci(deploy): configure GitHub Actions CI and production deployment`

#### Goal
Configure automated CI workflows for test execution, linting, and setup production deployment pipelines for backend (Render) and frontend (Vercel/Render).

#### Why this chunk exists
Ensures automated code quality gates on PRs and automated production builds upon merge to `main`.

#### Dependencies
- Depends on: Chunks 01 through 10

#### Scope
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) running test suites and ESLint checks on every PR.
- Render deployment configuration (`render.yaml`).
- Production environment documentation and configuration guide (`DEPLOYMENT.md`).

#### Deliverables
- [ ] GitHub Actions Workflow (`.github/workflows/ci.yml`)
- [ ] Render Blueprint (`render.yaml`)
- [ ] Deployment Guide (`DEPLOYMENT.md`)

#### Files/Folders Expected
```text
.github/
  workflows/ci.yml
render.yaml
DEPLOYMENT.md
```text

#### Acceptance Criteria
- GitHub Actions triggers automatically on pull requests to `develop` and `main`.
- Failing tests or lint errors block PR merging.
- Production build completes cleanly without environment errors.

#### Testing Checklist
- [ ] CI pipeline execution check on GitHub Actions.
- [ ] Production build verification (`npm run build` for backend and frontend).

#### Definition of Done
- CI pipeline green.
- Live deployment verified.
- CodeRabbit HIGH and CRITICAL issues resolved.

---

## Complete Feature Dependency Graph

```mermaid
graph TD
    C01[Chunk 01: Backend Project Setup] --> C02[Chunk 02: Backend Authentication]
    C01 --> C07[Chunk 07: Frontend Project Setup]
    C02 --> C03[Chunk 03: Backend Folders & Tags]
    C02 --> C04[Chunk 04: Backend Notes Core]
    C02 --> C08[Chunk 08: Frontend Authentication]
    C04 --> C05[Chunk 05: Backend Attachments]
    C04 --> C06[Chunk 06: Backend Background Jobs]
    C04 --> C09[Chunk 09: Frontend Notes Editor]
    C03 --> C10[Chunk 10: Frontend Organization & Search]
    C04 --> C10
    C07 --> C08
    C08 --> C09
    C09 --> C10
    C05 --> C11[Chunk 11: Deployment & CI/CD]
    C06 --> C11
    C10 --> C11
```text

---

## Pull Request Roadmap

| PR | Branch Name | Feature | Depends On |
|---|---|---|---|
| **PR 01** | `feature/backend/project-setup` | Backend Foundation & Infrastructure | None |
| **PR 02** | `feature/backend/authentication` | Backend Authentication & JWT | PR 01 |
| **PR 03** | `feature/backend/folders-tags` | Backend Folders & Tags API | PR 01, PR 02 |
| **PR 04** | `feature/backend/notes-core` | Backend Notes Core CRUD & Search | PR 01, PR 02, PR 03 |
| **PR 05** | `feature/backend/attachments` | Backend Attachments & Cloudinary | PR 01, PR 02, PR 04 |
| **PR 06** | `feature/backend/background-jobs` | BullMQ Trash Purge & Export Jobs | PR 01, PR 04 |
| **PR 07** | `feature/frontend/project-setup` | Frontend Vite & Design System Setup | PR 01 |
| **PR 08** | `feature/frontend/authentication` | Frontend Auth Pages & Context | PR 02, PR 07 |
| **PR 09** | `feature/frontend/notes-editor` | Frontend Tiptap Editor & Dashboard | PR 04, PR 08 |
| **PR 10** | `feature/frontend/organization-search` | Frontend Folders, Tags & Search UI | PR 03, PR 04, PR 09 |
| **PR 11** | `feature/deployment` | CI/CD GitHub Actions & Production Deploy | PR 01–10 |

---

## Estimated Timeline

| Week | Focus Area | Planned PRs |
|---|---|---|
| **Week 1** | Backend Setup & Authentication | PR 01, PR 02 |
| **Week 2** | Backend Domain APIs (Folders, Tags, Notes) | PR 03, PR 04 |
| **Week 3** | Backend Attachments & Background Jobs | PR 05, PR 06 |
| **Week 4** | Frontend Setup & Authentication UI | PR 07, PR 08 |
| **Week 5** | Frontend Notes Editor & Core Workspace | PR 09 |
| **Week 6** | Frontend Organization, Search & Filtering | PR 10 |
| **Week 7** | System Integration & Testing | PR 10 refinement |
| **Week 8** | CI/CD Pipeline & Final Production Deploy | PR 11 |

---

## Risk Analysis

| Risk / Bottleneck | Potential Impact | Mitigation Strategy |
|---|---|---|
| **Large PR sizes causing slow review** | Delayed feedback cycles, merge conflicts | Enforce strict 300–800 LOC scope per PR. Split large components into sub-features. |
| **JWT Refresh Race Conditions** | Random 401 errors during simultaneous API calls | Implement single-flight request queue for token refreshes in frontend API client. |
| **Database Search Performance** | Slow query responses on large note volume | Utilize MongoDB compound text indexes and regex bounds; paginate all query results. |
| **Cloudinary Buffer Overhead** | Memory spikes during file uploads | Stream upload buffers using Multer memory storage with file size limits (max 10MB). |

---

## Code Review Strategy

Reviewers and CodeRabbit should verify each PR against these specific criteria:

1. **Architecture Layering:**
   - Controllers handle HTTP request/response parsing only (zero business logic).
   - Services handle domain logic and call repositories.
   - Repositories are the only layer interacting with Mongoose models, returning `.lean()` plain JS objects.
2. **Error Handling:**
   - Every async route handler is wrapped in `asyncHandler()`.
   - Errors are thrown as custom `AppError` subclasses (never raw `res.status().json()`).
3. **Security & Validation:**
   - Inbound request payloads are validated via Zod schemas (`validate(schema)`).
   - Passwords, tokens, and credentials are never logged or returned in queries by default.
4. **Code Quality:**
   - ESLint and formatting standards strictly met.
   - All unit and integration test suites pass green before merging.
