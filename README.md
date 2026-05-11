# Elevate Underground Lab Access

Full-stack lab access management system for Illinois Tech Robotics. Built with **Next.js 14**, **Neon Postgres**, **Drizzle ORM**, **Nodemailer**, and **Tailwind CSS**.

---

## Quick Start (Local Dev)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Open `.env.local` and fill in your values (see sections below).

### 3. Set up the database
```bash
# Push schema to your Neon database (creates tables)
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Run locally
```bash
npm run dev
# → http://localhost:3000
```

---

## Database Setup (Neon via Vercel)

This is the **recommended** path - Vercel manages billing and the connection is automatic.

1. Deploy to Vercel first (or create a project): [vercel.com/new](https://vercel.com/new)
2. In your Vercel project → **Storage** tab → **Create Database** → **Postgres**
3. Select a region close to your users → Create
4. Go to the database → **Settings** → copy `DATABASE_URL`
5. Add it to Vercel → **Settings → Environment Variables** as `DATABASE_URL`
6. For local dev: add the same `DATABASE_URL` to your `.env.local`
7. Run `npm run db:push` to create tables
8. Run `npm run db:seed` to add sample data

### Alternative: Neon directly
1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string from **Connection Details**
3. Use it as `DATABASE_URL` in both `.env.local` and Vercel env vars

### Database commands
```bash
npm run db:push      # Apply schema changes to DB (no migration files needed in dev)
npm run db:generate  # Generate SQL migration files
npm run db:migrate   # Apply migration files
npm run db:studio    # Open Drizzle Studio (visual DB browser)
npm run db:seed      # Insert sample data
```

---

## Email Setup

Uses **Nodemailer** with SMTP. Gmail is simplest:

1. Enable **2-Step Verification** on the Gmail account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate a new App Password for "Mail"
4. Set in `.env.local`:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=you@gmail.com
   EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
   ```

For **SendGrid**, **Mailgun**, or **Resend SMTP**, change `EMAIL_HOST`/`EMAIL_PORT` accordingly.

> Note: If email credentials aren't set, the app logs a warning and skips sending - it won't crash.

---

## Deploy on Vercel

```bash
# Option A: via CLI
npm i -g vercel
vercel

# Option B: Connect GitHub repo at vercel.com → auto-deploys on push
```

**Required environment variables in Vercel project settings:**
| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon/Postgres connection string |
| `ADMIN_PASSWORD` | Admin dashboard password |
| `DISCORD_BOT_API_KEY` | Key for Discord bot API calls |
| `EMAIL_HOST` | SMTP host |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password or App Password |
| `NOTIFICATION_EMAIL` | Override notification recipient (optional) |

---

## Discord Bot Integration

### Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/lab/status` | Current lab status + next request |
| `GET` | `/api/lab/schedule` | Upcoming schedule blocks |
| `POST` | `/api/lab/open` | Mark lab as Open |
| `POST` | `/api/lab/closed` | Mark lab as Closed |
| `POST` | `/api/lab/limbo` | Mark lab as Limbo |

### Authentication
Include `x-api-key` header with your `DISCORD_BOT_API_KEY`:

```js
// Example Discord bot slash command handler
await fetch("https://your-app.vercel.app/api/lab/open", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.DISCORD_BOT_API_KEY,
  },
  body: JSON.stringify({
    responsiblePerson: interaction.user.username,
    notes: "Lab open for evening session!",
  }),
});
```

---

## Project Structure

```
app/
  page.tsx                  Homepage
  request/page.tsx          Request access form
  schedule/page.tsx         Visual calendar + request log
  admin/page.tsx            Admin dashboard (password protected)
  api/
    request/route.ts        Submit / list requests
    admin/route.ts          Admin: update status, query requests
    calendars/route.ts      Upload .ics availability files
    lab/
      status/route.ts       GET current status
      open/route.ts         POST → open
      closed/route.ts       POST → closed
      limbo/route.ts        POST → limbo
      schedule/route.ts     GET schedule blocks

components/
  Nav.tsx                   Sticky navigation bar
  LabStatusCard.tsx         Status display with next opening
  LabRequestForm.tsx        Full request form with validation
  DatePickerInput.tsx       Calendar date picker (react-day-picker)
  TimePickerInput.tsx       Advanced time picker with search
  RequestCard.tsx           Request display card
  WeekCalendar.tsx          Visual 7-day grid calendar

lib/
  db.ts                     Neon + Drizzle client
  schema.ts                 Drizzle schema (all table definitions)
  queries.ts                All database queries
  email.ts                  Nodemailer email utility
  icsParser.ts              .ics parsing + free/busy computation
  labStatus.ts              State config + auth helpers
  seed.ts                   Sample data seeder

types/
  index.ts                  TypeScript interfaces
```

---

## Schema Overview

Three tables:

**`lab_requests`** - one row per access request from a member  
**`lab_status`** - single "singleton" row, always upserted, holds current state  
**`availability_calendars`** - one row per person's .ics upload, events stored as JSONB  

---

Built with Next.js 14 · Neon Postgres · Drizzle ORM · Tailwind CSS · Nodemailer
