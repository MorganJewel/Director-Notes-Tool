# Director Margin AI

A theatrical director's rehearsal notes tool. Type notes in real time, auto-link them to script locations, get AI autocomplete suggestions, and review organized notes at the end of a session.

---

## Features

- **Login / Register** via Supabase email + password auth
- **Dashboard** — view all past productions and their notes
- **New Session** — enter a production name and optionally upload a PDF script
  - PDF text is extracted with PDF.js
  - If the PDF is scanned (no text), Tesseract.js OCR runs on the first 10 pages automatically
- **Rehearsal Mode** — split-screen view: script on the left, note entry on the right
  - Auto-fills page number from the current script position
  - "Suggest Completion" sends your in-progress note to HuggingFace Mistral-7B and returns 2–3 short completions to click-append
  - "Complete Note" saves to Supabase
- **End Session** — review all notes sortable by Actor, Page, Scene, or Emotional Category
  - "What did I mean?" sends each note + its script context to the AI for a plain-English interpretation
- **Settings** — enter Supabase and HuggingFace credentials (stored in `localStorage` only)

---

## Supabase Setup

### 1. Create a project

Go to [supabase.com](https://supabase.com), create a new project, and note your **Project URL** and **Anon/Public Key** from **Settings → API**.

### 2. Run the schema

Open the **SQL Editor** in your Supabase dashboard and run:

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  production_name text not null,
  script_name text,
  created_at timestamptz default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  content text not null,
  page_number integer,
  scene text,
  line_snippet text,
  actor text,
  emotional_category text,
  timestamp_seconds integer,
  created_at timestamptz default now()
);

-- Row Level Security
alter table sessions enable row level security;
alter table notes enable row level security;

create policy "Users manage own sessions"
  on sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage notes for own sessions"
  on notes for all
  using (
    exists (
      select 1 from sessions
      where sessions.id = notes.session_id
        and sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sessions
      where sessions.id = notes.session_id
        and sessions.user_id = auth.uid()
    )
  );
```

### 3. Enable email auth

In your Supabase project go to **Authentication → Providers → Email** and make sure it is enabled. For local dev you can turn off "Confirm email" so you can log in immediately after registering.

---

## HuggingFace Setup

1. Create a free account at [huggingface.co](https://huggingface.co)
2. Go to **Settings → Access Tokens**
3. Create a token with **Read** scope
4. Paste it into the Settings screen in the app

The app uses `mistralai/Mistral-7B-Instruct-v0.2` via the free Inference API. If you see a "Model is loading" error, wait ~30 seconds and try again — cold starts are normal on the free tier.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser. On first run, click **Configure API Keys** and enter your Supabase URL, Supabase Anon Key, and HuggingFace API token.

---

## Deploying to GitHub Pages

### Option A — Manual

```bash
npm run build
```

This produces a `dist/` folder. Push its contents to the `gh-pages` branch of your repo, or use any static host.

### Option B — GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

Then go to your repo **Settings → Pages → Source** and choose **GitHub Actions**.

After deployment, open the app URL, go to **Settings**, and enter your API credentials — they are stored only in your browser's `localStorage`.

---

## File Structure

```
director-margin-ai/
├── index.html
├── vite.config.js
├── package.json
├── .gitignore
└── src/
    ├── main.js          — hash router, app entry point
    ├── state.js         — shared in-memory session state
    ├── supabase.js      — Supabase client (reads keys from localStorage at call time)
    ├── apertus.js       — all HuggingFace Inference API calls
    ├── settings.js      — localStorage read/write for API credentials
    ├── pages/
    │   ├── login.js
    │   ├── dashboard.js
    │   ├── newSession.js
    │   ├── rehearsal.js
    │   ├── endSession.js
    │   └── settings.js
    └── styles/
        └── main.css
```

---

## Notes & Limitations

- The parsed script PDF is kept in browser memory only for the duration of the session tab — it is never uploaded to Supabase.
- OCR (Tesseract.js) is loaded lazily and only runs when PDF.js extracts fewer than 50 characters per page on average.
- All API credentials live in `localStorage` and never leave the browser except as Authorization headers to Supabase and HuggingFace.
