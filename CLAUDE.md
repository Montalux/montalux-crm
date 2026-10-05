# Kunden-CRM Strahlhorn

Schlankes CRM für die Strahlhorn-Kunden von Montalux. Kein Sales-Tool: Firmen, Kontakte mit Rollen, Lizenzen, Module, AVV, dazu Projekte, Wiedervorlagen, Dokumente und Stunden aus dem Timetracker. Mails laufen über MailerLite, das CRM liefert nur den CSV-Export. Umfang: ca. 12 Firmen, 50 Kontakte, ein bis zwei Benutzer.

## Entscheide

- **Stack:** gleicher Stack wie der Montalux-Timetracker (GitHub, Supabase Cloud Free in Zürich, eu-central-2). Frontend-Framework und Hosting vom Timetracker übernehmen. Dessen Repo zuerst lesen, nichts neu erfinden.
- **Gleiches Supabase-Projekt wie der Timetracker** (Zürich). Trennung allein über den Claim `crm`. Das Timetracker-Repo nicht verändern, dort wird aktiv gearbeitet.
- **Hosting:** öffentliches Repo + GitHub Pages (Org auf GitHub Free). `VITE_BASE` erlaubt später eigenes Hosting. Backups nur im privaten Repo `montalux-backups`.
- **Kein Self-Hosting auf Nine.** Das PHP/SQLite-Prototyp (`crm-handover/reference-php/`, nicht in diesem Repo) war nur Vorlage für Funktionen und Logik.
- **Kein Over-Engineering.** Kein State-Management-Framework, keine ORM-Schicht, keine eigene Auth. Supabase Auth und direkte Client-Queries reichen.
- Code mit 2 Leerzeichen Einrückung. UI auf Deutsch (Schweiz), kein `ß`, Umlaute als ä/ö/ü, Datum `TT.MM.JJJJ`, Beträge `CHF 12'000`.

## Datenmodell

`supabase/migrations/001_init.sql`: firma, kontakt (rollen als text[]), lizenz, modul, avv, dazu View `lizenz_kuendigung`.
`002_erweiterungen.sql`: firma.customer_id (→ Timetracker `customers`), firma.anzahl_strahlhorn_user, lizenz.preismodell/abrechnungsintervall, Tabellen abo_stand, projekt, wiedervorlage, dokument, View `firma_stunden_monat`, privater Bucket `crm-dokumente`.

RLS ist aktiv. Zugriff nur mit JWT-Claim `app_metadata.crm = true`, weil im selben Projekt die Timetracker-User liegen können und nicht jeder Kundendaten sehen soll. Claim für Pascals User setzen (Dashboard oder Admin-API), bevor etwas testbar ist.

Rollen: Entscheider, Fachlich, Technisch, Rechnung, Datenschutz. Status: Kunde, Pilot, Interessent, Ex-Kunde.

## Funktionen (Reihenfolge = Priorität)

1. **Übersicht:** Karte pro Firma mit Status, Kürzel, Kontakten mit Rollen, E-Mail, Telefon. Suche über Firma, Kürzel, Tenant, Kontakt, E-Mail. Filter nach Status und Rolle.
2. **Erfasst im CRM** (pro Firma, in Übersicht und Detail): Anzahl Kontakte, Lizenzen, Module, aktuelle AVV-Version oder «kein AVV», Hinweis pro fehlender Rolle.
3. **Firmenseite:** Stammdaten plus Kontakte, Lizenzen, Module, AVV mit Hinzufügen, Bearbeiten, Löschen. Firma löschen mit Bestätigung (Kaskade).
4. **Kündigungsfristen:** «Kündigen bis» = Ende minus Frist in Tagen. Zustände: `ok`, `soon` (bis 90 Tage), `missed` (Frist verstrichen, Lizenz läuft noch), `expired`. Auf der Übersicht Hinweis bei `soon` und `missed`.
5. **Export MailerLite:** CSV mit `email, name, last_name, company, rollen, segment`, filterbar nach Segment, Rolle, Status. Nur Kontakte mit E-Mail. Nachname = letztes Wort von `name`.
6. **Import MailerLite:** CSV-Upload mit Vorschau. Fixe Spalten (email, name, last_name, company, groups → Segment), Firma per Name (neu anlegen falls fehlt), bestehende E-Mail wird übersprungen, ohne Firma per Dropdown zuordnen.
7. **Wiedervorlage:** pro Firma, Block «Fällig» auf der Übersicht (überfällig + 7 Tage). Keine Mails.
8. **Vertrag:** Preismodell als Freitext (Verträge sind je Kunde individuell, das CRM rechnet nichts), Abo-Stand von Hand nachgetragen mit Veränderung zum Vorwert.
9. **Projekte** ohne Rechnungen, **Dokumente** als Upload oder Link, **Stunden** pro Monat aus dem Timetracker (nur lesen).

Logik portiert nach `src/lib/crm.ts` (`kuendigungInfo`, `firmaStats`).

## Nicht bauen

Pipeline, Deals, Aktivitätsverlauf, Mail-Versand, Rechte pro Rolle, Rechnungen/Fakturajournal, Zeiterfassung im CRM, Synchronisation mit Strahlhorn. Falls ein Verlauf pro Firma (Telefonate, Notizen mit Datum) gewünscht ist, kommt er als eigene Tabelle später.

## Datenschutz (revDSG)

Personendaten (Kontakte) und Lizenzbeträge. Supabase Zürich ist akzeptiert. Offen für Pascal: Supabase im Subunternehmerverzeichnis von Montalux eintragen, und beachten, dass der Free-Plan keine automatischen Backups hat und das Projekt nach einer Woche Inaktivität pausiert. Backup täglich über das private Repo `montalux-backups`.

## Definition of Done

Migration läuft sauber auf einem leeren Supabase-Projekt. Alle Funktionen oben sind im Browser mit Testdaten durchgeklickt. Ohne Claim `crm` sind alle Tabellen leer bzw. gesperrt (prüfen). Keine Secrets im Repo.
