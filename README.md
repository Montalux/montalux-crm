# Kunden-CRM Strahlhorn

Schlankes CRM für die Strahlhorn-Kunden von Montalux: Firmen, Kontakte mit Rollen, Lizenzen mit Kündigungsfristen, Abo-Stand, Module, AVV, Projekte, Wiedervorlagen, Dokumente, Stunden aus dem Timetracker, Export und Import für MailerLite.

## Tech-Stack

Wie der Montalux-Timetracker: React 19 + TypeScript, Vite, React Router, Tailwind CSS 4 + daisyUI 5, Supabase (Postgres, Auth, Storage, RLS), GitHub Pages.

Das CRM liegt im **selben Supabase-Projekt** wie der Timetracker (Zürich, eu-central-2). Kundendaten sind nur mit dem JWT-Claim `app_metadata.crm = true` sichtbar; der Team-User des Timetrackers sieht nichts.

## Lokale Entwicklung

```bash
npm install
cp .env.example .env.local   # Werte eintragen
npm run dev
```

Läuft auf http://localhost:5173/montalux-crm/

## Einrichtung Supabase (einmalig)

1. SQL Editor: `supabase/migrations/001_init.sql`, danach `002_erweiterungen.sql` ausführen.
2. Authentication → Users → «Add user» pro Person (E-Mail + Passwort, «Auto Confirm User»).
3. Claim setzen (SQL Editor):
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"crm": true}'
   where email = 'vorname.nachname@montalux.ch';
   ```
   Der Claim gilt erst nach erneutem Anmelden.
4. Authentication → Sign In / Providers: «Allow new users to sign up» muss **aus** sein.

`supabase/seed_test.sql` enthält erfundene Testdaten und ist nur für Test-Projekte gedacht.

## Deployment

Push auf `main` → GitHub Actions baut und deployt auf GitHub Pages. Repository-Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Umzug auf eigenes Hosting: mit `VITE_BASE=/` bauen und alle Routen auf `index.html` umleiten (siehe `DEPLOY.md` im Timetracker).

## Backup

Läuft im privaten Repo `Montalux/montalux-backups` (Tabellen von Timetracker und CRM plus Dateien aus dem Bucket `crm-dokumente`). Dieses Repo ist öffentlich und enthält deshalb weder Daten noch Backups.
