-- Erweiterungen: Timetracker-Verknüpfung, Abrechnung, Projekte, Wiedervorlage, Dokumente
-- Gleiche Zugriffsregel wie 001: nur JWT-Claim app_metadata.crm = true

alter table firma
  add column customer_id integer references customers(id) on delete set null,
  add column anzahl_strahlhorn_user int check (anzahl_strahlhorn_user >= 0);

alter table lizenz
  add column preismodell text,
  add column abrechnungsintervall text
    check (abrechnungsintervall in ('monatlich', 'quartalsweise', 'halbjährlich', 'jährlich'));

create table abo_stand (
  id bigint generated always as identity primary key,
  firma_id bigint not null references firma(id) on delete cascade,
  stichtag date not null,
  anzahl_aktive_abos int not null check (anzahl_aktive_abos >= 0),
  notiz text
);

create table projekt (
  id bigint generated always as identity primary key,
  firma_id bigint not null references firma(id) on delete cascade,
  titel text not null,
  status text not null default 'Offeriert'
    check (status in ('Offeriert', 'Laufend', 'Abgeschlossen', 'Verworfen')),
  offerte_chf numeric(12, 2),
  start date,
  ende date,
  notiz text
);

create table wiedervorlage (
  id bigint generated always as identity primary key,
  firma_id bigint not null references firma(id) on delete cascade,
  kontakt_id bigint references kontakt(id) on delete set null,
  faellig_am date not null,
  text text not null,
  erledigt boolean not null default false
);

-- Entweder hochgeladene Datei (storage_path im Bucket crm-dokumente) oder externer Link
create table dokument (
  id bigint generated always as identity primary key,
  firma_id bigint not null references firma(id) on delete cascade,
  typ text not null default 'Sonstiges' check (typ in ('Vertrag', 'AVV', 'Offerte', 'Sonstiges')),
  titel text not null,
  datum date,
  bemerkung text,
  storage_path text,
  url text,
  check (num_nonnulls(storage_path, url) = 1)
);

create index on abo_stand (firma_id);
create index on projekt (firma_id);
create index on wiedervorlage (firma_id);
create index on wiedervorlage (faellig_am) where not erledigt;
create index on dokument (firma_id);

-- Stunden pro Firma und Monat aus dem Timetracker. security_invoker: RLS von firma greift,
-- ohne Claim crm bleibt die View leer.
create view firma_stunden_monat with (security_invoker = true) as
select f.id as firma_id,
  date_trunc('month', t.date)::date as monat,
  round(sum(t.duration_minutes) / 60.0, 2) as stunden
from firma f
join time_entries t on t.customer_id = f.customer_id
group by f.id, date_trunc('month', t.date);

alter table abo_stand enable row level security;
alter table projekt enable row level security;
alter table wiedervorlage enable row level security;
alter table dokument enable row level security;

create policy crm_access on abo_stand for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true');
create policy crm_access on projekt for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true');
create policy crm_access on wiedervorlage for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true');
create policy crm_access on dokument for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true')
  with check ((auth.jwt() -> 'app_metadata' ->> 'crm') = 'true');

-- Privater Bucket für Dokumente
insert into storage.buckets (id, name, public) values ('crm-dokumente', 'crm-dokumente', false);

create policy crm_dokumente_access on storage.objects for all to authenticated
  using (bucket_id = 'crm-dokumente' and (auth.jwt() -> 'app_metadata' ->> 'crm') = 'true')
  with check (bucket_id = 'crm-dokumente' and (auth.jwt() -> 'app_metadata' ->> 'crm') = 'true');
