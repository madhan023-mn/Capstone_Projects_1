# API & WebSocket Protocol Documentation
## Real-Time Collaborative Workspace (SyncSpace)

This document provides a complete reference for all REST API endpoints, WebSocket connection requirements, payload structures, status codes, and error formats.

---

### 1. Authentication Endpoints

#### `POST /api/auth/register`
Creates a new user account, initializes their default workspace, and sets an HTTP-only session cookie.

- **Request Body:**
  ```json
  {
    "name": "Alice Johnson",
    "email": "alice@collab.io",
    "password": "Password123!"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "message": "Account created successfully",
    "user": {
      "id": "cly101...",
      "name": "Alice Johnson",
      "email": "alice@collab.io",
      "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice%20Johnson"
    },
    "defaultWorkspaceId": "clw202...",
    "defaultDocumentId": "cld303..."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Email already in use or validation failure.

---

#### `POST /api/auth/login`
Authenticates user credentials and issues an HTTP-only JWT session cookie.

- **Request Body:**
  ```json
  {
    "email": "alice@collab.io",
    "password": "Password123!"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "message": "Logged in successfully",
    "user": {
      "id": "cly101...",
      "name": "Alice Johnson",
      "email": "alice@collab.io"
    },
    "defaultWorkspaceId": "clw202...",
    "defaultDocumentId": "cld303..."
  }
  ```
- **Error Response:** `401 Unauthorized` for invalid email or password.

---

#### `GET /api/auth/me`
Retrieves current authenticated user profile and their associated workspaces with member roles.

- **Headers:** Includes session cookie `collab_session_token`.
- **Success Response (`200 OK`):**
  ```json
  {
    "user": {
      "id": "cly101...",
      "name": "Alice Johnson",
      "email": "alice@collab.io",
      "avatarUrl": "https://..."
    },
    "workspaces": [
      {
        "id": "clw202...",
        "name": "Acme Product & Engineering",
        "slug": "acme-product-engineering",
        "role": "OWNER"
      }
    ]
  }
  ```

---

#### `POST /api/auth/logout`
Clears session cookies and invalidates the browser session.

---

### 2. Workspace Endpoints

#### `GET /api/workspaces`
Lists all workspaces the current user belongs to, along with member and document counts.

#### `POST /api/workspaces`
Creates a new workspace. The creating user becomes `OWNER`.

- **Request Body:**
  ```json
  {
    "name": "Core Platform Team",
    "description": "Design docs and engineering roadmaps"
  }
  ```

#### `GET /api/workspaces/:id`
Retrieves workspace metadata, member list, document list, and recent activity logs.

#### `PUT /api/workspaces/:id`
Updates workspace title or description (`ADMIN` or `OWNER` required).

#### `DELETE /api/workspaces/:id`
Permanently deletes the workspace and cascades deletion to documents (`OWNER` only).

---

### 3. Workspace Member Management (RBAC)

#### `GET /api/workspaces/:id/members`
Lists all members in the workspace with their roles.

#### `POST /api/workspaces/:id/members`
Adds/invites a user by email with a designated role (`ADMIN` or `OWNER` required).

- **Request Body:**
  ```json
  {
    "email": "bob@collab.io",
    "role": "EDITOR" // ADMIN | EDITOR | COMMENTER | VIEWER
  }
  ```

#### `PUT /api/workspaces/:id/members`
Updates an existing member's role (`ADMIN` or `OWNER` required).

- **Request Body:**
  ```json
  {
    "userId": "usr_bob123",
    "role": "COMMENTER"
  }
  ```

#### `DELETE /api/workspaces/:id/members?userId=:userId`
Removes a member from the workspace (prevented for workspace owner).

---

### 4. Document Endpoints

#### `GET /api/workspaces/:id/documents`
Lists active documents in the workspace.

#### `POST /api/workspaces/:id/documents`
Creates a new document (`EDITOR`, `ADMIN`, or `OWNER` required).

- **Request Body:**
  ```json
  {
    "title": "Q4 Strategic Roadmap",
    "icon": "🚀"
  }
  ```

#### `GET /api/documents/:id`
Fetches document metadata, user's effective role, comment count, and version count.

#### `PUT /api/documents/:id`
Updates document title, icon, or archive state (`EDITOR` or above required).

---

### 5. Collaboration WebSocket Auth Token

#### `GET /api/documents/:id/token`
Generates a signed JWT token for connecting to the real-time WebSocket server.

- **Success Response (`200 OK`):**
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "usr_101",
      "name": "Alice Johnson",
      "color": "#F43F5E",
      "role": "OWNER"
    },
    "wsUrl": "ws://localhost:1234"
  }
  ```

---

### 6. Comments & Threading API

#### `GET /api/documents/:id/comments`
Retrieves all comments with authors and threaded replies.

#### `POST /api/documents/:id/comments`
Creates a comment tied to the document or highlighted selection (`COMMENTER` or above required).

- **Request Body:**
  ```json
  {
    "content": "Should we include automated backups in this milestone?",
    "targetText": "Architecture Guidelines"
  }
  ```

#### `PUT /api/documents/:id/comments/:commentId`
Toggles `isResolved` boolean or updates comment text.

#### `POST /api/documents/:id/comments/:commentId/replies`
Adds a reply to an existing comment thread.

---

### 7. Version History & Snapshot API

#### `GET /api/documents/:id/versions`
Lists all saved version snapshots for the document with version numbers, timestamps, and creator info.

#### `POST /api/documents/:id/versions`
Captures an immutable snapshot of the document's current Yjs CRDT state (`EDITOR` or above required).

- **Request Body:**
  ```json
  {
    "label": "Release v1.0 Draft"
  }
  ```

#### `POST /api/documents/:id/versions/:versionId/restore`
Restores the document's binary state to the specified snapshot and logs an audit trail event in `ActivityLog`.

---

### 8. WebSocket Collaboration Server Protocol

- **Endpoint:** `ws://localhost:1234/:documentId?token=:jwtToken`
- **Handshake Verification:**
  - Token is verified with `JWT_SECRET`.
  - Token must have matching `documentId`.
  - If role is `VIEWER` or `COMMENTER`, client is restricted to read-only sync.
- **Wire Message Types:**
  - `0`: Sync Message (`SyncStep1`, `SyncStep2`, `Update`)
  - `1`: Awareness Message (Cursor coordinates, selection ranges, user metadata)
- **Health Check Endpoint:**
  - `GET http://localhost:1234/health`
  - Returns: `{ "status": "ok", "uptime": 124.5, "activeRooms": 3, "redis": { "isRedisActive": true } }`
