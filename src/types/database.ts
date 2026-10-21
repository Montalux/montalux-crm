// Column names match supabase/migrations/*.sql

export interface Firma {
  id: number
  name: string
  kuerzel: string | null
  status: string
  tenant: string | null
  adresse: string | null
  notiz: string | null
  customer_id: number | null
  anzahl_strahlhorn_user: number | null
  telefon_zentrale: string | null
  created_at: string
}

export interface Kontakt {
  id: number
  firma_id: number
  name: string
  rollen: string[]
  funktion: string | null
  email: string | null
  telefon: string | null
  mobile: string | null
  ml_segment: string | null
  notiz: string | null
}

export interface Lizenz {
  id: number
  firma_id: number
  produkt: string
  start: string | null
  ende: string | null
  kuendigungsfrist_tage: number | null
  betrag_chf: number | null
  preismodell: string | null
  abrechnungsintervall: string | null
  notiz: string | null
}

export interface Modul {
  id: number
  firma_id: number
  modul: string
  aktiv_seit: string | null
}

export interface Avv {
  id: number
  firma_id: number
  version: string
  unterzeichnet_am: string | null
  ablage_link: string | null
  subunternehmer_stand: string | null
}

export interface AboStand {
  id: number
  firma_id: number
  stichtag: string
  anzahl_aktive_abos: number
  notiz: string | null
}

export interface Projekt {
  id: number
  firma_id: number
  titel: string
  status: string
  offerte_chf: number | null
  start: string | null
  ende: string | null
  notiz: string | null
}

export interface Wiedervorlage {
  id: number
  firma_id: number
  kontakt_id: number | null
  faellig_am: string
  text: string
  erledigt: boolean
}

export interface Dokument {
  id: number
  firma_id: number
  typ: string
  titel: string
  datum: string | null
  bemerkung: string | null
  storage_path: string | null
  url: string | null
}

export interface StundenMonat {
  firma_id: number
  monat: string
  stunden: number
}

export interface Customer {
  id: number
  name: string
  active: boolean
}

// Firma with all child records, as loaded by useFirmen/useFirma
export interface FirmaFull extends Firma {
  kontakt: Kontakt[]
  lizenz: Lizenz[]
  modul: Modul[]
  avv: Avv[]
  wiedervorlage: Wiedervorlage[]
}
