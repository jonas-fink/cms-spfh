# SPFH CMS – Frontend

React-Frontend für das **SPFH-Dokumentationssystem** (Sozialpädagogische Familienhilfe).
Fachkräfte sehen ihre zugewiesenen Familien, tragen Termine ein und laden Berichte hoch;
Admins behalten die Auslastung aller Fachkräfte im Blick.

## Stack

- **React 19 + TypeScript**
- **Vite** als Dev/Build-Tool
- **React Router v7** (`createBrowserRouter`)
- **Tailwind v4** mit eigenen Design-Tokens (`@theme inline` in `index.css`)
- **fetch-Wrapper** (`utils/api.ts`) mit automatischem Access-Token-Refresh und Retry

## Struktur

Pages sind reine Orchestratoren — die eigentliche UI sitzt in granularen
Komponenten unter `/components/<domain>`:

```
src/
  pages/         LoginPage, FKDashboard, ClientDetailPage, AdminDashboardPage
  layouts/       AppLayout (Fachkraft), AdminLayout
  components/
    shared/      Button, Card, Icon, KPICard, HoursRing, Modal, …
    dashboard/   KPIStrip, ClientsGrid, WeeklyChart, UpcomingAppointmentsRail, …
    client/      ClientCard, ClientDetailHeader, TabUebersicht, TabVerlauf
    appointment/ TabTermine, AppointmentForm
    document/    TabDokumente (Drag&Drop-Upload mit S3 Presigned URLs)
    hilfeplan/   TabHilfePlan
    admin/       WorkloadTable, ClientDistribution, AlertsPanel
  context/       AuthContext + useAuth-Hook
  hooks/         useDashboardData
  types/         Single Source of Truth für alle Frontend-Typen
  utils/         api, format, colors
```

## Wichtige Patterns

- **Auth**: Access-Token im Memory, Refresh-Token als httpOnly-Cookie. Bei 401 wird
  einmal transparent refreshed; schlägt das fehl, wird ein `auth:logout`-Event gefeuert.
- **API-Calls**: `api.get<T>(path)` liefert direkt den Payload (der Wrapper stripped
  `{ data: … }` einmalig).
- **Dark Mode**: über `[data-theme="dark"]` auf dem Root-Element.

## Lokal starten

Backend muss parallel auf `http://localhost:8080` laufen (siehe `cms-backend/`).
Die Vite-Konfig proxyt `/api` automatisch dorthin.

```bash
npm install
npm run dev
```

Login (Seed): `admin@spfh.de` / `admin1234` oder `a.berger@spfh.de` / `fk12345`.
