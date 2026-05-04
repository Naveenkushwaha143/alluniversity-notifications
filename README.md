# All University Notifications

All University Notifications is a Next.js application for students who want one place to track university notices, exam alerts, board updates, admissions, results, admin announcements, and education blog posts.

The app uses a local SQLite database through Prisma, scrapes official university and exam/board websites directly, stores the results in the database, and shows a combined live notification feed in the UI.

## Table of Contents

1. Project Status
2. Main Features
3. Tech Stack
4. Folder Structure
5. Requirements
6. Environment Setup
7. Install Dependencies
8. Database Setup
9. Run the App
10. Build and Production Start
11. Database Models
12. Scraping System
13. Live Notification System
14. Admin System
15. Blog System
16. API Reference
17. UI Behavior
18. Useful Commands
19. Troubleshooting
20. Notes for Future Development

## 1. Project Status

Current working state:

- Frontend runs on Next.js at `http://localhost:3000`.
- Database is SQLite at `db/custom.db`.
- Prisma schema is synced with the local database.
- University scraping works without `.z-ai-config`.
- Exam and board scraping works without `z-ai` CLI.
- Live notifications show both university notices and exam notifications.
- Notification ticker is slower and hides when the user scrolls.
- Board cards are clickable and open the official board websites.

## 2. Main Features

Student-facing features:

- Browse universities by state, district, and type.
- Search university list.
- View latest notices from universities.
- Filter notices by university, state, category, and search text.
- View entrance exam information.
- View board exam information.
- Open official university, exam, and board links.
- Read admin-published announcements.
- Read education blog posts.
- Use dark/light/system theme mode.
- See live notifications from database and optional WebSocket service.

Admin-facing features:

- Admin login with email/password from environment variables.
- Create admin posts.
- Pin important posts.
- Activate/deactivate posts.
- Create and manage blog posts.
- Publish/unpublish blog posts.
- Scrape latest university and exam notifications.
- Auto-create admin posts from important scraped notices.

Backend features:

- Prisma ORM with SQLite.
- API routes for universities, notices, exams, scraping, blogs, admin posts, auth, cleanup, and live notifications.
- Direct official-website scraping for universities, NTA exams, and boards.
- Duplicate detection by URL and title similarity.
- Category detection for results, exams, admissions, fees, tenders, recruitment, syllabus, and notifications.
- Old notice cleanup to keep each university feed compact.

## 3. Tech Stack

Core:

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma ORM
- SQLite
- Tailwind CSS v4
- shadcn/ui style components
- Radix UI primitives
- Framer Motion
- Lucide React icons
- Sonner toast notifications

Runtime/package tooling:

- Bun is used by the existing scripts and lockfile.
- `bun.lock` is the active lockfile.
- `package-lock.json` was removed during cleanup.

Optional realtime layer:

- `socket.io-client` is used by the frontend.
- `mini-services/notification-service` contains an optional notification server.
- The app does not depend on the socket service to show notifications because `/api/live-notifications` provides DB-backed polling.

## 4. Folder Structure

Important folders:

```text
db/
  custom.db

prisma/
  schema.prisma

public/
  logos/
  uploads/

src/
  app/
    api/
    globals.css
    layout.tsx
    page.tsx
  components/
    ui/
  hooks/
  lib/

mini-services/
  notification-service/
```

Important files:

```text
.env
package.json
bun.lock
next.config.ts
tailwind.config.ts
tsconfig.json
src/lib/db.ts
src/lib/website-scraper.ts
src/lib/exam-scraper.ts
src/lib/admin-auth.ts
```

Deleted as unused/generated cleanup:

```text
.zscripts/
examples/
skills/
download/
upload/
package-lock.json
tsconfig.tsbuildinfo
```

## 5. Requirements

Recommended:

- Windows, Linux, or macOS
- Bun installed
- Node.js 20 or newer

Check Bun:

```bash
bun --version
```

Check Node:

```bash
node --version
```

## 6. Environment Setup

Create `.env` in the project root.

Minimum database variable:

```env
DATABASE_URL=file:../db/custom.db
```

Admin login variables:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_JWT_SECRET=change-this-to-a-long-random-secret
```

Complete example:

```env
DATABASE_URL=file:../db/custom.db
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_JWT_SECRET=local-dev-secret-change-in-production
```

Important note about SQLite path:

Prisma resolves SQLite relative paths from the `prisma/schema.prisma` location. That is why this project uses:

```env
DATABASE_URL=file:../db/custom.db
```

This points from `prisma/` back to the project root and then into `db/custom.db`.

## 7. Install Dependencies

Install dependencies:

```bash
bun install
```

If you prefer npm, the scripts can still run through npm, but this project currently uses `bun.lock` as the main lockfile.

## 8. Database Setup

Generate Prisma client:

```bash
bun run db:generate
```

Push schema to SQLite:

```bash
bun run db:push
```

Seed university data:

Start the app, then open:

```text
http://localhost:3000/api/seed
```

The frontend also calls `/api/seed` during initial load.

Database file:

```text
db/custom.db
```

Schema file:

```text
prisma/schema.prisma
```

## 9. Run the App

Start development server:

```bash
bun run dev
```

Local URL:

```text
http://localhost:3000
```

Network URL depends on your machine and router. Next.js prints it in the terminal when the server starts.

Stop the server on Windows if needed:

```powershell
Stop-Process -Id <PID>
```

Find process using port 3000:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

## 10. Build and Production Start

Build:

```bash
bun run build
```

Start production standalone server:

```bash
bun run start
```

The build script creates a Next.js standalone output and copies static assets into the standalone folder.

## 11. Database Models

### University

Stores university metadata:

- Name
- Short name
- Website
- State
- District
- Type
- Description
- Logo
- Theme color
- Active status

Relation:

- One university has many notices.

### Notice

Stores scraped or created university notices:

- University ID
- Title
- Description
- Source URL
- Published date
- Category
- Important flag

Categories are detected from text such as:

- Exam
- Result
- Admission
- Holiday
- Fee
- Recruitment
- Tender
- Academic
- Convocation
- Notification

### ExamNotification

Stores exam and board notifications:

- Title
- Description
- Source URL
- Exam name
- Exam type (`NTA` or `BOARD`)
- Board name
- State
- Category
- Exam date
- Last date
- Important flag
- Active status

### AdminPost

Stores admin-created announcements:

- Title
- Content
- Category
- Source URL
- Image URL
- Pinned status
- Active status

### BlogPost

Stores blog articles:

- Title
- Slug
- Excerpt
- Content
- Cover image
- Author
- Tags
- Category
- Read time
- Published status
- Views
- Active status

## 12. Scraping System

Scraping no longer requires:

- `.z-ai-config`
- `z-ai` CLI
- External web search API

The app now scrapes official websites directly.

Shared website scraper:

```text
src/lib/website-scraper.ts
```

Exam scraper:

```text
src/lib/exam-scraper.ts
```

University scraping routes:

```text
POST /api/scrape
POST /api/scrape/university/[id]
GET  /api/scrape
GET  /api/scrape/university/[id]
```

Exam scraping route:

```text
POST /api/exams
```

Bulk scrape behavior:

1. Selects a random active batch of universities.
2. Scrapes official university pages for notices.
3. Stores new notices in the database.
4. Scrapes a rotating batch of exam/board targets.
5. Stores new exam notifications in the database.
6. Creates admin posts from important new notices.
7. Cleans old notices to keep feeds compact.
8. Emits notifications to optional socket service if it is running.

Single university scrape behavior:

1. Checks cooldown and per-client rate limit.
2. Looks up the selected university in database.
3. Scrapes its official website and likely notice pages.
4. Saves unique notices.
5. Returns count of new notices.

Exam targets include:

- National Testing Agency
- JEE Main
- NEET UG
- CUET UG
- UGC NET
- CBSE Board
- NIOS Board
- Bihar Board
- Haryana Board
- UP Board
- MP Board
- Rajasthan Board
- Gujarat Board
- Maharashtra Board
- Odisha Board
- Jharkhand Board

## 13. Live Notification System

The app supports two notification paths.

### DB-backed live feed

Primary and reliable path:

```text
GET /api/live-notifications
```

This combines:

- Latest `Notice` records
- Latest `ExamNotification` records

Frontend behavior:

- Loads live notifications during app startup.
- Refreshes live notifications every 60 seconds.
- Updates the notification bell dropdown.
- Updates the live notifications section.
- Works even if the WebSocket mini-service is not running.

### Optional WebSocket service

Optional realtime push path:

```text
mini-services/notification-service
```

The app tries to connect to port `3003`.

If the socket service is not available:

- App still works.
- Notifications still show from `/api/live-notifications`.
- The UI may show reconnecting for socket status.

## 14. Admin System

Admin auth uses:

```text
src/lib/admin-auth.ts
```

Login endpoint:

```text
POST /api/admin/login
```

Auth check:

```text
GET /api/admin/login
```

Logout:

```text
DELETE /api/admin/login
```

Admin session:

- Stored in HTTP-only cookie named `admin_token`.
- Token expires after 24 hours.
- Token encryption uses `ADMIN_JWT_SECRET`.

Required admin env variables:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_JWT_SECRET=long-random-secret
```

Admin can manage:

- Admin posts
- Blog posts
- Publishing status
- Pinned posts
- Scraping actions
- Cleanup actions

## 15. Blog System

Public blog routes:

```text
GET /api/blog/posts/public
GET /api/blog/posts/slug/[slug]
```

Admin blog route:

```text
GET    /api/blog/posts?all=true
POST   /api/blog/posts
PUT    /api/blog/posts
DELETE /api/blog/posts?id=...
```

Blog supports:

- Markdown-like content display
- Cover image URL
- Tags
- Category
- Read time
- Draft/published mode
- Views
- Active/inactive control

## 16. API Reference

### Health/root API

```text
GET /api
```

Returns a basic JSON response.

### Universities

```text
GET  /api/universities
POST /api/universities
```

Query params:

```text
state
district
type
search
limit
```

Example:

```text
/api/universities?state=Bihar&limit=50
```

### Notices

```text
GET    /api/notices
DELETE /api/notices
```

Query params:

```text
universityId
category
state
search
limit
page
```

Example:

```text
/api/notices?state=Uttar%20Pradesh&category=Exam&limit=20
```

### Scrape

```text
GET  /api/scrape
POST /api/scrape
```

Bulk scrape response includes:

```text
newNotices
newExamNotifications
newAdminPosts
deletedNotices
universitiesScraped
examTargetsChecked
batchTotal
rateLimited
cooldownActive
```

### Single university scrape

```text
GET  /api/scrape/university/[id]
POST /api/scrape/university/[id]
```

### Exams

```text
GET  /api/exams
POST /api/exams
```

GET query params:

```text
type=NTA|BOARD
category
state
limit
```

POST body:

```json
{
  "type": "ALL"
}
```

Valid types:

```text
ALL
NTA
BOARD
```

### Live notifications

```text
GET /api/live-notifications
```

Query params:

```text
limit
```

Returned item types:

```text
kind=university
kind=exam
```

### Notify

```text
POST /api/notify
```

Used for forwarding notifications to the optional socket service.

### Admin posts

```text
GET    /api/admin/posts
POST   /api/admin/posts
PUT    /api/admin/posts
DELETE /api/admin/posts
```

Public posts:

```text
GET /api/admin/posts/public
```

### Cleanup

```text
GET /api/admin/cleanup
```

Deletes old/inactive items according to cleanup route logic.

### Seed

```text
GET /api/seed
```

Seeds predefined universities into the database.

## 17. UI Behavior

Main views:

- Home
- Universities
- Notices
- Entrance
- Boards
- Admin

Notification ticker:

- Shows latest important items.
- Moves slowly using CSS animation.
- Pauses on hover.
- Hides when the user scrolls down.

Notification bell:

- Shows unread count.
- Opens latest live notifications.
- Shows both university and exam notifications.
- Clicking an item opens the source URL if available.

Board section:

- Groups boards by state.
- Board card opens official website.
- Visit Website link also opens official website.

Live notification section:

- Shows recent notification cards.
- Uses DB-backed live feed.
- Does not require socket service.

## 18. Useful Commands

Development:

```bash
bun run dev
```

Build:

```bash
bun run build
```

Start production:

```bash
bun run start
```

Lint:

```bash
bun run lint
```

Generate Prisma client:

```bash
bun run db:generate
```

Push schema:

```bash
bun run db:push
```

Create migration:

```bash
bun run db:migrate
```

Reset database:

```bash
bun run db:reset
```

Run exam scrape manually:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/exams" -Method Post -ContentType "application/json" -Body '{"type":"ALL"}'
```

Run bulk scrape manually:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/scrape" -Method Post
```

Check live notifications:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/live-notifications?limit=5"
```

## 19. Troubleshooting

### App does not start

Check dependencies:

```bash
bun install
```

Check port 3000:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

Stop old process:

```powershell
Stop-Process -Id <PID>
```

### Database connection error

Check `.env`:

```env
DATABASE_URL=file:../db/custom.db
```

Regenerate Prisma:

```bash
bun run db:generate
```

Sync schema:

```bash
bun run db:push
```

### Admin login not working

Make sure these are present:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_JWT_SECRET=long-random-secret
```

Restart dev server after changing `.env`.

### Scraping returns zero notices

Possible reasons:

- University website is down.
- Website blocks automated requests.
- Website changed notice page structure.
- Existing notices are already stored and duplicate detection skipped them.

This is not always a failure. A successful scrape can return zero new items.

### Old `.z-ai-config` error in logs

The scraper was changed to direct website scraping. If old logs still show `.z-ai-config` errors, they are from previous runs. New scraping code does not require `.z-ai-config`.

### Socket status shows reconnecting

This only means the optional socket service is not connected. The DB-backed live feed still works through:

```text
/api/live-notifications
```

### Lint or TypeScript check fails

There are existing project-wide issues unrelated to the scraping/live notification changes, including old React hook lint rules and optional example/mini-service type dependencies. API endpoint tests are the best quick verification for current runtime behavior.

## 20. Notes for Future Development

Good next improvements:

- Add a real `/api/upload` route or remove the unused upload button from admin UI.
- Add proper socket.io server dependency if the mini-service should be production-supported.
- Add pagination to live notifications.
- Add scheduled scraping with a background worker or cron.
- Add per-university scraping rules for websites with unusual HTML.
- Add admin controls for enabling/disabling exam scrape targets.
- Add structured logs instead of only console logs.
- Add automated tests for scraper parsing and duplicate detection.
- Add production database support such as PostgreSQL for deployment at scale.

## Quick Start Summary

```bash
bun install
bun run db:generate
bun run db:push
bun run dev
```

Open:

```text
http://localhost:3000
```

Core local database:

```text
db/custom.db
```

Most important live feed endpoint:

```text
/api/live-notifications
```

Most important scrape endpoint:

```text
/api/scrape
```
