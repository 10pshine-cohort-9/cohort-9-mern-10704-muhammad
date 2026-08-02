# cohort-9-mern-10704-muhammad
Cohort 9 — MERN (NodeJS+ReactJS) assignment for Muhammad Sajid

# NotesHub — Production-Grade MERN Notes Application

**Cohort 9 — MERN (Node.js + React.js) Assignment**  
**Author:** Muhammad Sajid  
**Repo:** `cohort-9-mern-10704-muhammad`

---

## 📌 Overview

NotesHub is a full-stack, production-grade MERN notes management application built with a strict layered architecture (`Route → Middleware → Controller → Service → Repository → Mongoose Model`).

It provides user authentication, rich text editing with Tiptap, real-time debounced autosave, hierarchical folder management, tagging, full-text search, pinning, archiving, soft deletion with automated trash purge background workers, and file attachments.

---

## 🛠️ Technology Stack

### Backend
- **Core:** Node.js & Express (CommonJS)
- **Database:** MongoDB Atlas & Mongoose ODM
- **Authentication:** JWT (Short-lived access token + httpOnly refresh cookie) & bcrypt password hashing
- **Validation:** Zod request schema validation
- **Logging:** Pino structured logging with field redaction
- **Background Jobs:** BullMQ & Upstash Redis
- **File Storage:** Cloudinary & Multer
- **Email:** Resend transactional email

### Frontend
- **Core:** React 18 & Vite
- **Styling:** CSS Design Tokens & HSL Tailored Theme System
- **Rich Text Editor:** Tiptap Editor
- **Icons:** Lucide React & Material Symbols

### Testing & Quality Assurance
- **Backend Testing:** Mocha, Chai, Sinon & Supertest
- **Code Reviews:** CodeRabbit Automated AI Review

---

## 📁 Repository Architecture

```text
cohort-9-mern-10704-muhammad/
├── backend/                  # Express REST API (Layered Architecture)
│   ├── src/
│   │   ├── config/           # Environment & database configs
│   │   ├── logger/           # Pino logger configuration
│   │   ├── common/           # Shared errors, utils, and middleware
│   │   └── modules/          # Feature modules (auth, notes, folders, tags, etc.)
│   └── tests/                # Unit & Integration test suites
│
├── frontend/                 # React + Vite SPA
│
├── IMPLEMENTATION_PLAN.md    # Feature-based PR Implementation Roadmap
├── README.md                 # Project Landing Documentation
└── .coderabbit.yaml          # CodeRabbit Automated AI Review Config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Running Tests
```bash
cd backend
npm test
```

---

## 📜 Development & Git Workflow

All feature development follows the **Feature-Based PR Workflow**:
1. Branch off `main`: `git checkout -b feature/<area>/<feature-name>`
2. Create PRs targeting `develop`: `feature/<area>/<feature-name> → develop`
3. Maintain small PR sizes (**300–800 lines of code**) for CodeRabbit & mentor reviews.
