# ⚡ SyncSpace: Real-Time Collaborative Workspace
> **Production-style multiplayer document workspace inspired by Notion and Figma.**  
> Built with **Next.js 14, TipTap (ProseMirror), Yjs CRDTs, WebSockets, PostgreSQL, Redis, and Prisma**.

---

## 🌟 Overview & Key Features

SyncSpace allows distributed teams to create, edit, organize, and collaborate on documents in real time without race conditions or data loss:

- **Mathematical Concurrency (Yjs CRDTs)**: Conflict-free Replicated Data Types resolve concurrent edits to paragraphs, lists, and formatting deterministically without locking.
- **Multiplayer Presence & Cursors**: Live colored cursor carets and name tags follow collaborator movements; active presence avatars appear in the document header.
- **Rich-Text TipTap Editor**: Headings (H1-H3), bold, italic, underline, strikethrough, highlight, checklists (task lists), code blocks, blockquotes, and dividers.
- **Dual-Boundary RBAC Security**: Strict 5-tier role hierarchy (`OWNER`, `ADMIN`, `EDITOR`, `COMMENTER`, `VIEWER`) enforced at both the REST API and WebSocket connection layer.
- **Horizontal Scaling via Redis**: Multi-server cross-instance coordination using Redis Pub/Sub channels to sync edits across server nodes.
- **Debounced Persistence & Snapshots**: In-memory editing backed by debounced (2s) binary serialization into PostgreSQL via Prisma; named version snapshots with instant one-click rollback.
- **Threaded Comments**: Inline and document-level comments with target excerpts, replies, and resolve/reopen statuses.

---

## 🏗️ System Architecture

```
                    ┌─────────────────────────────────────────┐
                    │    Web Browser Clients (Alice & Bob)    │
                    │  TipTap Editor + Yjs CRDT + Awareness   │
                    └──────────────────┬──────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
      (HTTP / App Router)                               (WebSockets)
                │                                             │
                ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     Next.js Web / API Layer   │             │   Collaboration Server Node   │
│       (Port 3000)             │             │         (Port 1234)           │
│  - Auth (JWT / bcrypt)        │             │  - y-websocket protocol       │
│  - Workspaces & Permissions   │             │  - lib0 binary sync           │
│  - Comments & Versions        │             │  - WebSocket Handshake Auth   │
│  - Signed WS Tokens           │             │  - Read-Only Mode Enforcement │
└───────────────┬───────────────┘             └───────────────┬───────────────┘
                │                                             │
                │        ┌─────────────────────────────┐      │
                │        │  Redis Pub/Sub (Port 6379)  │◄─────┘
                │        │  Horizontal Server Scaling  │
                │        └─────────────────────────────┘
                ▼                                             ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                 Prisma ORM / Database Layer                 │
        │  PostgreSQL Database: collaborative_workspace (Port 5432)   │
        │  - Users, Workspaces, Members, Documents, Versions, Comments│
        └─────────────────────────────────────────────────────────────┘
```

---

## 🧰 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Rich-Text Engine** | TipTap 2 with ProseMirror Framework |
| **Real-Time CRDT** | Yjs (`yjs`), `y-protocols`, `y-websocket`, `lib0` |
| **WebSocket Server** | Node.js `ws` server with JWT Handshake Auth & RBAC enforcement |
| **Horizontal Scaling** | Redis 7 Pub/Sub with resilient in-memory development fallback |
| **Database & ORM** | **PostgreSQL (Database: `collaborative_workspace`)** via Prisma ORM |
| **Security & Auth** | JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), Zod |
| **Testing** | Vitest (PostgreSQL CRUD, Unit & CRDT concurrency), Custom Load Benchmarking |

---

## 🚀 Quickstart Guide (Local Development in VS Code)

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+ or higher
- *(Optional for Docker mode)*: Docker Desktop / Docker Compose

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd Capstone_Projects1
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` is set to PostgreSQL:
```env
DATABASE_URL="url"
```

### 3. Start PostgreSQL Database

You have two easy options to run PostgreSQL on port 5432:

- **Option A (Instant Local Service — No Docker needed)**:
  ```bash
  npm run db:start
  ```
  *Initializes and starts a genuine PostgreSQL 18.4 server listening on port `5432` with UTF-8 encoding.*

- **Option B (Docker Compose)**:
  ```bash
  docker compose up -d
  ```
  *Starts PostgreSQL 16 container and Redis 7 container.*

### 4. Initialize, Seed & Verify PostgreSQL Database
Sync the Prisma schema, generate the Prisma client, populate starter data, and verify connectivity and CRUD operations:
```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run db:verify
```

### 5. Start the Application
Run all services (PostgreSQL daemon, Next.js web application, and Yjs WebSocket collaboration server) concurrently with a single command:
```bash
npm run dev:all
```
*Or run in separate VS Code terminal tabs:*
- **Terminal 1 (PostgreSQL Daemon)**: `npm run db:start` (Runs on `localhost:5432`)
- **Terminal 2 (Next.js App)**: `npm run dev` (Runs on `http://localhost:3000`)
- **Terminal 3 (Collaboration Server)**: `npm run collab` (Runs on `ws://localhost:1234`)

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 👥 Demo Accounts (Password: `Password123!`)

For instant testing, four pre-seeded accounts represent distinct permission levels:

| User Name | Email | Role | Capabilities |
| :--- | :--- | :--- | :--- |
| **Alice Johnson** | `alice@collab.io` | **OWNER** | Full control: delete workspace, manage members, edit, comment, restore versions |
| **Bob Smith** | `bob@collab.io` | **EDITOR** | Can create documents, edit content concurrently, create snapshots |
| **Carol Williams** | `carol@collab.io` | **COMMENTER** | Read-only editor; can post & resolve comments and reply threads |
| **David Miller** | `david@collab.io` | **VIEWER** | Strictly read-only viewer; cannot edit or post comments |

> 💡 **Multi-User Testing Tip**: Open `http://localhost:3000` in **Chrome**, log in as **Alice**, then open an **Incognito Window** or **Edge**, log in as **Bob**, and open the same document (`Q4 Product Roadmap & Vision`). You will see live colored cursors moving in real time as each user types!

## 📂 Project Structure

```
├── collaboration-server/          # Standalone Yjs WebSocket collaboration server
│   ├── persistence.js             # PostgreSQL binary Yjs state persistence & debounced saves
│   ├── redis-scaling.js           # Redis Pub/Sub multi-instance horizontal scaling
│   └── server.js                  # Authenticated WebSocket server with RBAC enforcement
├── prisma/
│   ├── schema.prisma              # PostgreSQL schema with models, relations & indexes
│   ├── seed.ts                    # TypeScript seed script for sample users, workspaces & docs
│   └── seed.js                    # Node.js seed runner
├── scripts/
│   ├── start-postgres.js          # Local PostgreSQL 18 daemon runner (UTF-8)
│   ├── verify-db.js               # PostgreSQL connection & CRUD lifecycle verifier
│   └── load-test.js               # 150-burst concurrent WebSocket load tester
├── src/
│   ├── app/                       # Next.js 14 App Router pages & API routes
│   │   ├── api/auth/              # Registration, login, logout, me
│   │   ├── api/workspaces/        # Workspace CRUD & membership routes
│   │   ├── api/documents/         # Document CRUD, comments, versions, and signed WS tokens
│   │   ├── dashboard/             # Workspace listing & creation UI
│   │   └── workspace/[id]/        # Real-time multi-user document editor UI
│   ├── components/
│   │   └── editor/                # TipTap editor, live cursors, comments & version drawer
│   ├── lib/
│   │   ├── auth.ts                # Session management & JWT handling
│   │   ├── permissions.ts         # 5-tier RBAC rules & mathematical hierarchy
│   │   ├── prisma.ts              # Global singleton Prisma client
│   │   ├── redis.ts               # Resilient Redis client with offline fallback
│   │   └── utils.ts               # Styling & collaborator color assignment
│   └── server/                    # Business logic and authorization services
│       ├── authorization.service.ts
│       ├── workspace.service.ts
│       └── document.service.ts
├── tests/
│   ├── auth-and-rbac.test.ts      # Authentication & 5-tier RBAC hierarchy tests
│   ├── crdt-concurrency.test.ts   # Mathematical Yjs CRDT convergence tests
│   └── postgres-crud.test.ts      # PostgreSQL Prisma CRUD lifecycle & cascade deletion tests
├── docker-compose.yml             # PostgreSQL 16 & Redis 7 container configuration
├── .env.example                   # Environment configuration template
└── package.json                   # Project scripts and dependencies
```

---

## 🧪 Testing & Load Benchmark

### Unit & CRDT Concurrency Tests
Run the automated Vitest test suite:
```bash
npm test
```
*Tests verify:*
- Password hashing & JWT signature verification
- Role-based access control (RBAC) hierarchy rules
- Simultaneous concurrent character insertion conflict resolution (CRDT convergence)
- Multi-client paragraph edits and binary snapshot restoration

### Real-Time WebSocket Load Benchmark
Simulate 10 concurrent WebSocket clients making 150 simultaneous burst edits to the collaboration server:
```bash
npm run test:load
```
**Measured Benchmark Performance:**
- **Duration**: ~1.94 - 2.00 seconds
- **Throughput**: **756.5 messages / second**
- **Average Latency**: **129.0 ms per burst**
- **Data Integrity**: **100% convergence, zero data loss**

---

## 📚 Project Documentation Links

- [System Architecture & CRDT Deep Dive](docs/ARCHITECTURE.md)
- [REST API & WebSocket Protocol Reference](docs/API_DOCUMENTATION.md)
- [10-Minute Final Presentation Script](docs/PRESENTATION.md)
- [Capstone Internship Reflection & Ownership](docs/INTERNSHIP_REFLECTION.md)

---

## 📄 License
MIT © 2026 SyncSpace Project Team
