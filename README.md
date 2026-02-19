# Inventory Management System

Production-ready full-stack inventory management with JWT auth, RBAC, AI features, and analytics.

## Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes (Node.js)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT (httpOnly cookie)

## Setup

1. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `DATABASE_URL` – PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/inventory_db`)
   - `JWT_SECRET` – Min 32 characters for production

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database**  
   **Option A – Migrations (recommended for production):**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
   **Option B – Push schema without migration history:**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Seed users

| Email               | Password   | Role   |
|---------------------|------------|--------|
| admin@example.com   | admin123   | ADMIN  |
| manager@example.com | manager123 | MANAGER|
| staff@example.com   | staff123   | STAFF  |

## Features

- **Inventory CRUD** – Create, read, update, delete with validation; status auto-updates from quantity vs reorder level.
- **Search & filter** – By name, category, status, quantity range; sort by name, quantity, price; pagination.
- **RBAC** – ADMIN (full + users), MANAGER (CRUD + analytics), STAFF (view + update quantity).
- **AI** – Reorder prediction, smart description generator, insights dashboard, natural language chat. Set `OPENAI_API_KEY` for real OpenAI (description + chat); otherwise mock/rule-based behavior is used.
- **Extras** – Inventory value, CSV export, activity log, dashboard charts, dark mode–ready UI.

## Push to your Git repository

1. **Create a new repository** on GitHub, GitLab, or Azure DevOps (don’t add a README or .gitignore there).

2. **In your project folder**, run:

   ```bash
   cd "c:\Users\TonyZwein\OneDrive - Valsoft Corporation\Desktop\Stock Management"

   git init
   git add .
   git commit -m "Initial commit: Inventory Management System"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual repo URL (e.g. `https://github.com/TonyZwein/inventory-app.git`). Use SSH instead if you prefer: `git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git`.

3. **Never commit `.env`** – it’s in `.gitignore`. On a new machine or in CI, copy `.env.example` to `.env` and fill in values.

## Deploy

- **Vercel:** Connect repo, set `DATABASE_URL` and `JWT_SECRET`, deploy.
- **Database:** Use Vercel Postgres, Neon, Supabase, or any PostgreSQL host; run `npm run db:migrate` (or `prisma db push`) and `npm run db:seed` after first deploy.
