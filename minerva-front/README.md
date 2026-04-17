# Minerva - Aerospace Management Platform

Minerva is a high-performance aerospace-themed management dashboard designed under the **"Galactic Oversight"** (The Celestial Navigator) design system. It handles user permissions, event scheduling, attendance tracking, and task flow management in an atmospheric, deep-space UX aesthetic.

## Features & Walkthrough

Below is a detailed walkthrough of the platform accompanied by real screenshots taken from the application.

### 1. Authentication & Login
Navigate to `/login` to access the robust, glass-morphic secure login panel. 
![Minerva Login Screen](https://github.com/UrsaCrux/Minerva/blob/feature/progresos/minerva-front/public/screenshots/login_page_1775338539791.png?raw=true)

*To use:* Enter your credentials (such as `aarevalor` / `123456` in dev) and click standard login. The container is powered by our global design tokens (`surface_container_lowest`) for recessed ambiance.

### 2. Dashboard (Inicio)
The primary landing screen. It displays your immediate telemetry.
![Dashboard Inicio](https://github.com/UrsaCrux/Minerva/blob/feature/progresos/minerva-front/public/screenshots/dashboard_inicio_1775338610335.png?raw=true)

*To use:* Here you can quickly gather actionable intelligence from upcoming events, your assigned critical tasks, and organizational news. The layout champions asymmetry and breathing room—core tenets of our design philosophy.

### 3. Task Workflows (Tareas)
A sophisticated view mapping dependencies across system tasks.
![Tareas Pipeline](https://github.com/UrsaCrux/Minerva/blob/feature/progresos/minerva-front/public/screenshots/tareas_page_real_1775338643720.png?raw=true)

*To use:* Tasks present themselves based on the completion of subtask hierarchies. Interactive nodes handle team assignments (Responsable vs. Participante) and display real-time user avatars on node progression. Statuses leverage our "No-line" `primary` glowing aesthetics.

- **Select / Deselect:** Click a node to select it (glowing outline). Click empty canvas space to deselect.
- **Expand subtasks:** Clicking a selected node fetches and renders its prerequisite subtasks below it.
- **Mostrar completadas toggle:** A pill toggle in the floating action panel controls visibility of completed tasks. OFF by default to keep the flowchart uncluttered. When ON, completed nodes appear as translucent ghosts (low opacity + desaturated) so past progress is visible without overwhelming active work.

### 4. Events Calendar (Eventos)
A massive, orbital timeline and event planner spanning the organization.
![Eventos View](https://github.com/UrsaCrux/Minerva/blob/feature/progresos/minerva-front/public/screenshots/eventos_page_real_1775338683775.png?raw=true)

*To use:* Click on any event to pull up a custom popover with deep-space glass aesthetics and metadata pills. Easily justify absences through the module interfaces. The view integrates *FullCalendar* with a custom dark-mode adaptation.

You can also create new events directly using the celestial event builder modal:
![Create Event Modal](https://github.com/UrsaCrux/Minerva/blob/feature/progresos/minerva-front/public/screenshots/create_event_modal_1775338701149.png?raw=true)

### 5. Progress Tracking (Progresos)
From the **Dashboard → Tus Asignaciones** panel, click "Ver detalles" on any task to open the Task Details dialog.

*To use:* Inside the dialog, click the **"Añadir"** button next to "Historial de Progreso" to reveal the inline form. Fill in a title and optionally a description, then click **"Guardar Progreso"**. Entries appear in reverse chronological order with author avatars.

### 6. Task Completion
The Task Details dialog features a **"Completar Tarea"** button in the footer.

*How it works:*
- The button is only enabled when **all subtasks** are marked `completado`.
- If subtasks are incomplete, the button appears disabled with reduced opacity.
- Server-side enforcement via a Postgres trigger prevents bypassing this rule.
- Upon completion, the task is **immediately deselected and hidden** from the flowchart (toggle must be ON to see it again).
- Completed tasks render as **ghosts** when shown — 38% opacity, desaturated — clearly communicating past vs. active work.
- The Task Details dialog header changes to a **teal gradient** with a "Tarea completada" badge when viewing a completed task.
- The hover tooltip for completed nodes also shows a teal-tinted background and a completion banner.

### 7. User Directory (Usuarios)
Global directory for team tracking and operational assignment.
![Usuarios Database](https://github.com/UrsaCrux/Minerva/blob/feature/progresos/minerva-front/public/screenshots/usuarios_page_real_1775338656735.png?raw=true)

*To use:* Check out team roles, assign task capabilities, and manage cross-system availability. Follows the "Tonal Layering" design philosophy where depth defines organization rather than lines.

### 8. Meeting Reports (Informes)
Navigate to `/informes` from the sidebar to view all meeting reports.

*To use:* Users with **permiso 4** can click "Nuevo Informe" to upload a PDF report with metadata: title, date, type (Reunión General, Comisión de Proyectos, etc.), and optionally tag attendees from the profiles list. All users can browse the card grid and click any card to view details and download the PDF.

### 9. Google Calendar Sync
Users can connect their Google account to automatically sync Minerva events to a dedicated secondary Google Calendar, keeping their personal schedule completely private.

*How it works:*
- Click **"Conectar Google Calendar"** in the calendar view to initiate the OAuth 2.0 flow.
- A dedicated secondary calendar named **"Minerva CCUC"** is automatically created in the user's Google account.
- The app only asks for permission to manage *calendars it creates*, guaranteeing it cannot read or modify the user's primary/personal calendar events.
- After granting permission, events are automatically pushed to the "Minerva CCUC" calendar on create/update/delete.
- Connected status is shown with a teal indicator badge; click **"Desconectar"** to revoke access.

*Architecture:*
- **`gcal-auth`** Edge Function: Generates Google OAuth URL with user context using the restricted `calendar.app.created` scope.
- **`gcal-callback`** Edge Function: Handles OAuth redirect, creates the secondary calendar, and stores the `calendar_id` alongside the tokens in `google_tokens`.
- **`gcal-sync`** Edge Function: Pushes event changes specifically to the mapped secondary calendar API for all connected users.

*Setup (admin):*
1. Set Supabase Edge Function secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
2. Configure OAuth consent screen and redirect URI in Google Cloud Console.

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Directory)
- **Styling:** Custom CSS based on the Galactic Oversight design specs (`dashboard.css`, `tareas.css`, etc.)
- **Database / Auth:** [Supabase](https://supabase.com/) integrating centralized hooks in `supa.js`.
- **UI Components:** Interactive overlays and visual telemetry via full-glass React components.
- **Performance:** Bulk permission checks via `getUserPermisosAll()` (single query instead of N sequential calls). Dashboard page lifts shared data (eventos, teams, session) into a single `Promise.all` and distributes to child components via props, eliminating duplicate Supabase calls.

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
