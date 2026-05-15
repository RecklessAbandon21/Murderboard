# Murderboard

Murderboard is an infinite canvas task board. Sticky notes are tasks, group regions are soft spatial containers, and each board is its own organization system. Authentication is provided by Clerk; each user has their own private boards.

It intentionally uses snapshot persistence: load the latest tldraw snapshot on startup, autosave the full snapshot after edits, and let the last save win if two devices edit at the same time. There are no CRDTs, operational transforms, WebSockets, or multiplayer systems.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env`:

   ```bash
   cp .env.example .env
   ```

3. Create a Clerk project at [dashboard.clerk.com](https://dashboard.clerk.com):
   - Copy the **Publishable key** → `VITE_CLERK_PUBLISHABLE_KEY` in `.env`
   - Copy the **Secret key** → `CLERK_SECRET_KEY` in `.env`
   - Under **Domains**, add `http://localhost:5173` as an allowed origin

4. Start MongoDB locally, or run only MongoDB with Docker:

   ```bash
   docker compose up mongodb
   ```

5. Start the API:

   ```bash
   npm run dev:server
   ```

6. Start Vite:

   ```bash
   npm run dev
   ```

Open `http://localhost:5173`. Unauthenticated visitors see the landing page; sign up or sign in to reach the board app.

## Production With Docker Compose

Build and start the stack:

```bash
docker compose up --build -d
```

Frontend: `http://localhost:8080`

Backend: `http://localhost:4000`

The included nginx config serves the frontend and proxies `/api` to the backend container. For an external reverse proxy, point public traffic at the frontend container.

Add `https://murderboard.dev` as an allowed origin in your Clerk dashboard before deploying.

## Environment Variables

Backend:

- `MONGO_URI`: MongoDB connection string.
- `CLERK_SECRET_KEY`: Clerk secret key (required).
- `PORT`: API port, defaults to `4000`.

Frontend:

- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key (required).
- `VITE_API_BASE_URL`: backend origin. Empty uses Vite's local `/api` proxy during development.

## JSON Export And Import

Use the sidebar buttons:

- `Export JSON` downloads the active board's tldraw snapshot plus completed-task archive metadata.
- `Import JSON` loads a previous exported snapshot into the active board and autosaves it.

Keep occasional exports as portable backups before large edits.

## MongoDB Backup

With Docker Compose:

```bash
docker compose exec mongodb mongodump --archive=/tmp/murderboard.archive --db=murderboard
docker compose cp mongodb:/tmp/murderboard.archive ./murderboard.archive
```

Restore:

```bash
docker compose cp ./murderboard.archive mongodb:/tmp/murderboard.archive
docker compose exec mongodb mongorestore --archive=/tmp/murderboard.archive --drop
```

## API

- `GET /api/boards`: list boards.
- `POST /api/boards`: create a board.
- `GET /api/boards/:boardId`: latest board snapshot.
- `PUT /api/boards/:boardId`: save the full board snapshot and any newly completed tasks.
- `PATCH /api/boards/:boardId`: rename a board.
- `DELETE /api/boards/:boardId`: delete a board and its archived tasks.
- `GET /api/boards/:boardId/tasks/done`: completed task archive for a board.
- `DELETE /api/boards/:boardId/tasks/done`: delete all completed tasks for a board.
- `POST /api/boards/:boardId/tasks/done/delete-selected`: delete selected completed tasks for a board.
- `DELETE /api/boards/:boardId/tasks/done/:id`: delete one completed task for a board.
- `POST /api/boards/:boardId/tasks/:id/restore`: mark one archived task restorable and return its stored shape.

## Roadmap / TODO

- **Real-time collaborative editing** — multiple users editing the same board simultaneously. Requires CRDTs or operational transforms and a WebSocket layer. Currently, last-save-wins is the only conflict resolution.
- **Linkable read-only view** — shareable URLs that let anyone view a board without an account. Would need a public-access token system and a read-only rendering mode.
- **Board sharing** — invite other users to access your boards. Requires an access-control model (owner, editor, viewer roles) and UI for managing members.
