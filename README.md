# ChronoFlow

A collaborative timeline planner. Create a workspace, invite members, and build interactive timelines made of stages, events, and goals, either from scratch or from a template.

> **Status: work in progress.** The core pieces below exist and the project is still being built.

<!-- Tambahkan screenshot di sini setelah kamu simpan di repo, misalnya docs/screenshot.png:
![ChronoFlow](docs/screenshot.png)
-->

## What it does

- **Authentication**: sign up and sign in with email, or continue with Google
- **Workspaces**: create a workspace during onboarding, then manage it from the dashboard
- **Members and invites**: invite people to a workspace and see pending invites
- **Templates**: start a timeline from one of nine templates (Novel writing, Game development, Company roadmap, Relationship timeline, Family tree, Project management, Historical timeline, Travel journal, Life milestones) or start on your own
- **Timeline editor**: build a timeline from stages and events
- **Goals**: each timeline can have goals with a priority, status, and deadline, and every goal has a checklist of requirements
- **Handoff inbox**: a page for handoffs between members
- **Cloud sync**: data lives in Supabase, so timelines are available after signing in

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | TanStack Start with TanStack Router |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui (Radix UI) components |
| Data and auth | Supabase (Postgres, authentication, Row Level Security) |
| Forms and validation | React Hook Form, Zod |
| Build tool | Vite |

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/auth` | Sign in and sign up, with email or Google |
| `/onboarding` | First-time setup, including creating a workspace |
| `/dashboard` | Workspaces, timelines, and templates |
| `/timeline/:id` | Timeline editor |
| `/members` | Workspace members and pending invites |
| `/inbox` | Handoff inbox |

All pages except `/` and `/auth` require a signed-in user.

## Getting started

### Prerequisites

- A recent version of [Node.js](https://nodejs.org/) (20 or newer)
- A [Supabase](https://supabase.com/) project

### Run it locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/xeroedels/timeline-crafted.git
   cd timeline-crafted
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create the database tables.** Run the SQL files in `supabase/migrations/` in order, either in the Supabase SQL editor or with the [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase db push`). They create these tables with Row Level Security: `profiles`, `workspaces`, `workspace_members`, `workspace_invites`, `timelines`, `timeline_stages`, `timeline_events`, `goals`, and `goal_requirements`.

4. **Add your environment variables.** Create a `.env` file in the project root. It is already listed in `.gitignore`, so it will not be committed.
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_URL=your-project-url
   SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   You can find the URL and keys in your Supabase project under **Project Settings → API**. The service role key bypasses Row Level Security, so keep it server-side and never commit it.

5. **Optional: enable Google sign-in.** To make the "Continue with Google" button work, turn on the Google provider in your Supabase project under **Authentication → Providers** and add your Google OAuth client ID and secret there. Email sign-in works without this.

6. **Start the dev server**
   ```bash
   npm run dev
   ```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Check the code with ESLint |
| `npm run format` | Format the code with Prettier |

## Project structure

```
src/
├── routes/                 # pages (TanStack Router, file-based)
├── components/             # app components; ui/ holds the shadcn/ui components
├── lib/                    # stores and timeline templates
├── integrations/supabase/  # Supabase clients, auth middleware, generated types
└── hooks/
supabase/
└── migrations/             # database schema and policies
```

## Author

Built by **Sagita Sasmita Wijaya**. See more at [xeroedels.github.io/portfolio](https://xeroedels.github.io/portfolio/).
