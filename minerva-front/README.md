# Minerva - Aerospace Management Platform

Minerva is a high-performance aerospace-themed management dashboard designed under the **"Galactic Oversight"** (The Celestial Navigator) design system. It handles user permissions, event scheduling, attendance tracking, and task flow management in an atmospheric, deep-space UX aesthetic.

## Features & Walkthrough

Below is a detailed walkthrough of the platform accompanied by real screenshots taken from the application.

### 1. Authentication & Login
Navigate to `/login` to access the robust, glass-morphic secure login panel. 
![Minerva Login Screen](/screenshots/login_page_1775338539791.png)

*To use:* Enter your credentials (such as `aarevalor` / `123456` in dev) and click standard login. The container is powered by our global design tokens (`surface_container_lowest`) for recessed ambiance.

### 2. Dashboard (Inicio)
The primary landing screen. It displays your immediate telemetry.
![Dashboard Inicio](/screenshots/dashboard_inicio_1775338610335.png)

*To use:* Here you can quickly gather actionable intelligence from upcoming events, your assigned critical tasks, and organizational news. The layout champions asymmetry and breathing room—core tenets of our design philosophy.

### 3. Task Workflows (Tareas)
A sophisticated view mapping dependencies across system tasks.
![Tareas Pipeline](/screenshots/tareas_page_real_1775338643720.png)

*To use:* Tasks present themselves based on the completion of subtask hierarchies. Interactive nodes handle team assignments (Responsable vs. Participante) and display real-time user avatars on node progression. Statuses leverage our "No-line" `primary` glowing aesthetics.

### 4. Events Calendar (Eventos)
A massive, orbital timeline and event planner spanning the organization.
![Eventos View](/screenshots/eventos_page_real_1775338683775.png)

*To use:* Click on any event to pull up a custom popover with deep-space glass aesthetics and metadata pills. Easily justify absences through the module interfaces. The view integrates *FullCalendar* with a custom dark-mode adaptation.

You can also create new events directly using the celestial event builder modal:
![Create Event Modal](/screenshots/create_event_modal_1775338701149.png)

### 5. User Directory (Usuarios)
Global directory for team tracking and operational assignment.
![Usuarios Database](/screenshots/usuarios_page_real_1775338656735.png)

*To use:* Check out team roles, assign task capabilities, and manage cross-system availability. Follows the "Tonal Layering" design philosophy where depth defines organization rather than lines.

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Directory)
- **Styling:** Custom CSS based on the Galactic Oversight design specs (`dashboard.css`, `tareas.css`, etc.)
- **Database / Auth:** [Supabase](https://supabase.com/) integrating centralized hooks in `supa.js`.
- **UI Components:** Interactive overlays and visual telemetry via full-glass React components.

---

## Getting Started Locally

Install dependencies:

```bash
npm install
```

Configure your environment. Export your Supabase keys in your local `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Agent / Developer Contribution Guidelines

Always refer to `.agents/rules/for_agents.md`. We operate strictly via:
* **Caveman Mode**
* Zero Hardcoding
* Strict Separation of Concerns
* Continual consultation of `roadmap.md`

Whenever expanding the schema or adding features, return here to document new modules and provide real screen captures in `/public/screenshots`.
