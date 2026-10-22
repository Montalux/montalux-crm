-- Neue Rollen «Strahlhorn User» und «Extern». rollen[1] (erstes Element) ist die Hauptrolle.

alter table kontakt drop constraint kontakt_rollen_check;

alter table kontakt add constraint kontakt_rollen_check
  check (rollen <@ array['Entscheider', 'Fachlich', 'Technisch', 'Rechnung', 'Datenschutz', 'Strahlhorn User', 'Extern']);
