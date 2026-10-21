-- Kontakt: Funktion (Jobtitel) und Mobile. Bestehendes kontakt.telefon gilt als Telefon direkt.
-- Firma: Telefon Zentrale. RLS-Regeln aus 001 gelten unverändert (nur neue Spalten).

alter table kontakt
  add column funktion text,
  add column mobile text;

alter table firma
  add column telefon_zentrale text;
