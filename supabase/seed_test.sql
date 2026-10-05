-- Erfundene Testdaten, nur für lokale/Test-Projekte. Nicht in Produktion ausführen.
-- Datumswerte relativ zu heute, damit alle vier Kündigungszustände vorkommen.

insert into customers (name) values ('Testverlag Alpen'), ('Musterpresse');
insert into employees (name) values ('Test Person');
insert into services (name, price_per_hour) values ('Support', 150);
insert into time_entries (employee_id, customer_id, service_id, date, duration_minutes)
select 1, 1, 1, (current_date - (n * 9))::date, 60 + (n % 4) * 30 from generate_series(0, 40) n;

insert into firma (name, kuerzel, status, tenant, adresse, customer_id, anzahl_strahlhorn_user) values
  ('Testverlag Alpen AG', 'TVA', 'Kunde', 'alpen', 'Musterstrasse 1' || chr(10) || '3000 Bern', 1, 8),
  ('Musterpresse GmbH', 'MUP', 'Pilot', 'muster', null, 2, 3),
  ('Beispiel Medien', 'BME', 'Interessent', null, null, null, null);

insert into kontakt (firma_id, name, rollen, email, telefon, ml_segment) values
  (1, 'Anna Beispiel', '{Entscheider,Rechnung}', 'anna@example.com', '+41 31 000 00 01', 'Kunden'),
  (1, 'Beat Muster', '{Technisch,Fachlich}', 'beat@example.com', null, 'Kunden'),
  (2, 'Carla Test', '{Entscheider}', 'carla@example.com', null, 'Pilot'),
  (3, 'Dario Probe', '{}', null, '+41 44 000 00 02', null);

insert into lizenz (firma_id, produkt, start, ende, kuendigungsfrist_tage, betrag_chf, preismodell, abrechnungsintervall) values
  (1, 'Strahlhorn Standard', current_date - 300, current_date + 400, 90, 12000, 'Grundgebühr 6''000 + CHF 0.80 pro Abo über 5''000', 'jährlich'),
  (1, 'Versandmodul', current_date - 300, current_date + 150, 90, 2400, null, 'quartalsweise'),
  (2, 'Strahlhorn Pilot', current_date - 100, current_date + 60, 90, 0, 'Pilot gratis', null),
  (2, 'Alt-Lizenz', current_date - 800, current_date - 10, 30, 1000, null, null);

insert into modul (firma_id, modul, aktiv_seit) values
  (1, 'CRM', current_date - 300), (1, 'Finanzen', current_date - 300), (2, 'CRM', current_date - 100);

insert into avv (firma_id, version, unterzeichnet_am, ablage_link) values
  (1, '1.0', current_date - 400, null), (1, '2.0', current_date - 200, 'https://example.com/avv');

insert into abo_stand (firma_id, stichtag, anzahl_aktive_abos) values
  (1, current_date - 90, 12450), (1, current_date - 30, 12610), (1, current_date, 12580);

insert into projekt (firma_id, titel, status, offerte_chf, start) values
  (1, 'Schnittstelle Webshop', 'Laufend', 8500, current_date - 20);

insert into wiedervorlage (firma_id, kontakt_id, faellig_am, text) values
  (1, 1, current_date - 2, 'Verlängerung Versandmodul besprechen'),
  (2, 3, current_date + 5, 'Pilot-Feedback einholen'),
  (2, null, current_date + 30, 'Später: Offerte Vollversion');
