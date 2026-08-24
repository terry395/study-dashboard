# StudyDash

StudyDash is a lightweight, high-performance personal life and study dashboard built with React, TypeScript, and Supabase.

## Features

- **Dashboard**: A comprehensive overview with a live clock, today's events, upcoming deadlines, tests, study goals, and overdue warnings.
- **Calendar**: Month, Week, Day, and Agenda views with support for recurring events and customizable categories.
- **Assignments**: Track coursework deadlines with smart date categorization and status indicators.
- **Tests**: Track upcoming exams with automatic countdowns.
- **Study Goals**: Set weekly goals, use the built-in study timer, and track your study history.
- **Modules**: Group your assignments, tests, and goals by academic module, complete with lecturer details and color-coding.
- **Settings**: Manage your profile, calendar categories, and easily backup/restore your data using JSON export/import.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS v4, Lucide React (icons)
- **Database/Auth**: Supabase (PostgreSQL, Row Level Security)
- **Utilities**: `date-fns` for robust date handling
- **Routing**: React Router DOM (Lazy loaded)

## Setup and Development

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure Environment Variables**
   Create a `.env.local` file based on `.env.example`:
   ```bash
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. **Run Database Migrations**
   Navigate to the Supabase SQL Editor and execute the contents of `supabase/migrations/001_initial_schema.sql`.
5. **Start the Development Server**
   ```bash
   npm run dev
   ```

## Production Build

To test the production build locally:
```bash
npm run build
npm run preview
```

## Deployment (Vercel)

The project includes a `vercel.json` file for SPA routing rewrite rules. Ensure the environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) are set up in your Vercel project settings before deployment.

## Design Philosophy

- **Reliability & Simplicity**: Fast performance with no bloat.
- **Data Ownership**: Full data isolation using Supabase RLS and manual JSON backups.
- **Visual Excellence**: Dark-mode first aesthetic with clean, responsive UI.

## License

MIT License
