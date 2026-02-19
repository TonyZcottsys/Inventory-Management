# Deploy Database + Web App on Render

Step-by-step guide to host your **PostgreSQL** database and **Next.js** app on [Render](https://render.com).

---

## Prerequisites

1. **Git repository** – Your project must be in a Git repo (GitHub or GitLab).  
   If it isn’t yet:
   - Create a repo on GitHub/GitLab.
   - In your project folder run:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
     git push -u origin main
     ```
2. **Render account** – Sign up at [render.com](https://render.com) (free tier is fine).

---

## One free database per account

Render allows **only one free PostgreSQL database per account**. If you see “cannot have more than one active free tier database”, you already have a free DB. Use it for this app instead of creating another.

- **Use your existing free database:** The current `render.yaml` deploys only the web app. You set **DATABASE_URL** in the Dashboard to your existing DB’s **Internal Database URL** (see Step 3 below).
- **Or create a new free DB for this project:** Delete the other free database in the Render Dashboard, then you can use a blueprint that includes a `databases` section again.

---

## Option A: Deploy with Blueprint (recommended)

The blueprint deploys the **web app only** and expects you to use an existing Postgres DB (because of the one-free-DB limit).

### Step 1: Create a new Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New** → **Blueprint**.
3. Connect your **GitHub** or **GitLab** account if you haven’t already.
4. Select the repository that contains this project.
5. Render will detect `render.yaml`. Click **Apply**.

### Step 2: Configure the Blueprint

1. Render will show **stock-management-app** (Web Service) only.
2. When prompted for **DATABASE_URL**, paste your existing free Postgres **Internal Database URL** (Dashboard → your PostgreSQL instance → **Info** / **Connect** → **Internal Database URL**). Or leave it blank and set it in Step 3.
3. Click **Apply** to create the service.

### Step 3: Set environment variables after first deploy

1. Open **stock-management-app** → **Environment**.
2. Set:
   - **DATABASE_URL** = your existing free Postgres **Internal Database URL** (if not set in Step 2).
   - **NEXT_PUBLIC_APP_URL** = `https://stock-management-app.onrender.com` (or the URL Render shows for your app).
   - **OPENAI_API_KEY** = your OpenAI key (if you use AI features).
3. (Optional) Replace **JWT_SECRET** with your own long random string.
4. Save. Render will redeploy with the new variables.

### Step 4: Open the app

- Open the app URL (e.g. `https://stock-management-app.onrender.com`).  
- **Note:** On the free plan, the app may “spin down” after ~15 minutes of no traffic; the first request after that can take 30–60 seconds.

---

## Option B: Manual setup (database and web service separately)

Use this if you prefer not to use the Blueprint or want to create services one by one.

### Step 1: Create PostgreSQL database

1. In the Render Dashboard go to **New** → **PostgreSQL**.
2. Name: `inventory-db`.
3. Region: e.g. **Oregon** (use the same region for the web app later).
4. Plan: **Free** (or paid if you prefer).
5. Click **Create Database**.
6. When it’s ready, open the database → **Info** (or **Connect**).
7. Copy the **Internal Database URL** (use this for the web app so it stays inside Render’s network).

### Step 2: Create Web Service (Next.js app)

1. Dashboard → **New** → **Web Service**.
2. Connect the repo that contains this project and select it.
3. Configure:
   - **Name:** e.g. `stock-management-app`
   - **Region:** same as the database (e.g. Oregon)
   - **Runtime:** Node
   - **Build Command:**  
     `npm install && npx prisma generate && npm run build`
   - **Start Command:**  
     `npx prisma migrate deploy && npm start`
   - **Instance type:** Free (or paid)

### Step 3: Environment variables

In the Web Service → **Environment** tab, add:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | The **Internal Database URL** from Step 1 |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | A long random string (e.g. 32+ characters) |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-WEB-SERVICE-URL.onrender.com` (your app’s URL) |
| `OPENAI_API_KEY` | Your OpenAI API key (if you use AI) |

Save. Render will redeploy.

### Step 4: Deploy

1. Click **Create Web Service** (or **Save** if you already created it).
2. Wait for the build and deploy to finish.
3. Open the service URL to use the app.

---

## After deployment

- **Database:** In the Render dashboard, your PostgreSQL instance shows connection info, metrics, and backups (on paid plans).
- **Logs:** Use the **Logs** tab on the Web Service for build and runtime logs.
- **Migrations:** The start command runs `prisma migrate deploy` before starting the app, so tables are created/updated on every deploy even if `DATABASE_URL` was not set at build time.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| **500 on `/api/auth/register` or “database not functional”** | Usually means the **User** table (and other tables) don’t exist. 1) Web Service → **Environment**: set `DATABASE_URL` to your Postgres **Internal Database URL** (with `?sslmode=require` if needed). 2) Set **Start Command** to `npx prisma migrate deploy && npm start` and **redeploy** so migrations run at startup and create tables. 3) Check **Logs** for the exact error. |
| **`type "Role" already exists`** / **Shared database with another app** | This app now uses its own schema **`inventory`**, so it no longer touches `public` (no conflict with another app’s `Role`/`Roles` or tables). From your machine with `DATABASE_URL` = Render **External** URL, mark the old public-schema migrations as applied so only the new one runs: `npx prisma migrate resolve --applied 20250218000000_init` then `npx prisma migrate resolve --applied 20250219100000_ensure_schema` then `npx prisma migrate deploy`. After that, redeploy the app; the `use_inventory_schema` migration will create the `inventory` schema and all tables there. |
| **P3009 – “failed migrations in the target database”** | Prisma blocks new migrations when a previous one is marked as failed. Clear the failed state by marking those migrations as applied (so they won’t be re-run), then deploy. With `DATABASE_URL` set to your DB (e.g. Render **External** URL), run: `npx prisma migrate resolve --applied 20250218000000_init` then `npx prisma migrate resolve --applied 20250219100000_ensure_schema` then `npx prisma migrate deploy`. Only the `use_inventory_schema` migration will run and create the `inventory` schema. |
| **P3018 – `ensure_schema` fails: “userId and id are of incompatible types: text and uuid”** | In a shared DB, `public."User"` may be from another app and have `id` as UUID; this app uses the **inventory** schema only. Mark the failed migration as applied so it’s skipped: `npx prisma migrate resolve --applied 20250219100000_ensure_schema` then `npx prisma migrate deploy`. |
| Build fails on `prisma migrate deploy` | Migrations now run at **start**, not build. Use build command `npm install && npx prisma generate && npm run build` and start command `npx prisma migrate deploy && npm start`. If you still run migrate in build, ensure `DATABASE_URL` is set before the build. |
| “Application failed to respond” | Free tier spin-up can take 30–60 s after idle. Try again; check **Logs** for crashes. |
| Login/API errors | Confirm `NEXT_PUBLIC_APP_URL` matches the app URL and `JWT_SECRET` is set. Seed users: run `npm run db:seed` locally with `DATABASE_URL` = Render **External** URL. |
| DB connection errors | Use the **Internal Database URL** for the Web Service; use **External** only when running commands from your own machine (e.g. seed). |

---

## Summary

- **Option A:** Push code to Git → New Blueprint → Connect repo → Apply → Set `NEXT_PUBLIC_APP_URL` and `OPENAI_API_KEY` in the app’s Environment.
- **Option B:** Create PostgreSQL → Create Web Service from repo → Set build/start commands and all env vars (including `DATABASE_URL` from the DB).

Your app will be live at `https://<your-service-name>.onrender.com`.
