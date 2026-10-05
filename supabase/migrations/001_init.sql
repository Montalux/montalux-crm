-- Kunden-CRM Strahlhorn: Firmen, Kontakte, Lizenzen, Module, AVV
-- Zugriff nur mit JWT-Claim app_metadata.crm = true (nicht jeder Timetracker-User darf Kundendaten sehen)

create table firma (
  id bigint generated always as identity primary key,
  name text not null,
  kuerzel text,
  status text not null default 'Kunde' check (status in ('Kunde', 'Pilot', 'Interessent', 'Ex-Kunde')),
  tenant text,
  adresse text,
  notiz text,
  created_at timestamptz not null default now()
);

create table kontakt (
  id bigint generated always as identity primary key,
  firma_id bigint not null references firma(id) on delete cascade,
  name text not null,
  rollen text[] not null default '{}'
    check (rollen <@ array['Entscheider', 'Fachlich', 'Technisch', 'Rechnung', 'Datenschutz']),
  email text,
  telefon text,
  ml_segment text,
  notiz text
);

create table lizenz (
  id bigint generated always as identity primary key,
  firma_id bigint not null references firma(id) on delete cascade,
  produkt text not null,
  start date,
  ende date,
  kuendigungsfrist_tage int check (kuendigungsfrist_tage >= 0),
  betrag_chf numeric(12, 2),
  notiz text
);

create table modul (
  id bigint generated always as identity primary key,
  firma_id bigint not null references firma(id) on delete cascade,
  modul text not null,
  aktiv_seit date
);

create table avv (
  id bigint generated always as identity primary key,
  firma_id bigint not null references firma(id) on delete cascade,
  version text not null,
  unterzeichnet_am date,
  ablage_link text,
  subunternehmer_stand date
);

create index on kontakt (firma_id);
create index on lizenz (firma_id);
create index on modul (firma_id);
create index on avv (firma_id);

-- Kündigungsdatum pro Lizenz: Ende minus Frist
create view lizenz_kuendigung with (security_invoker = true) as
select l.*, (l.ende - l.kuendigungsfrist_tage) as kuendigen_bis
from lizenz l;

-- RLS
alter table firma enable row level security;
alter table kontakt enable row level security;
alter table lizenz enable row level security;
alter table modul enable row level security;
alter table avv enable row level security;

create policy crm_access on firma for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true');
create policy crm_access on kontakt for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true');
create policy crm_access on lizenz for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true');
create policy crm_access on modul for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true');
create policy crm_access on avv for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true');
