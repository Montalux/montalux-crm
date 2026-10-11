// Field configuration per table (like CHILD in the PHP prototype's lib.php)
import type { Field } from '../components/RecordForm'
import type { Customer, Kontakt } from '../types/database'
import { DOKUMENT_TYPEN, INTERVALLE, PROJEKT_STATUS, ROLLEN, STATUS } from './crm'

export function firmaFields(customers: Customer[]): Field[] {
  return [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'kuerzel', label: 'Kürzel', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS },
    { key: 'tenant', label: 'Tenant (URL)', type: 'url' },
    {
      key: 'customer_id', label: 'Kunde im Timetracker', type: 'select',
      options: customers.map(c => ({ value: String(c.id), label: c.active ? c.name : `${c.name} (inaktiv)` })),
    },
    { key: 'anzahl_strahlhorn_user', label: 'Anzahl Strahlhorn-User', type: 'number' },
    { key: 'adresse', label: 'Adresse', type: 'textarea' },
    { key: 'notiz', label: 'Notiz', type: 'textarea' },
  ]
}

export const kontaktFields: Field[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'rollen', label: 'Rollen', type: 'multi', options: ROLLEN },
  { key: 'email', label: 'E-Mail', type: 'email' },
  { key: 'telefon', label: 'Telefon', type: 'tel' },
  { key: 'ml_segment', label: 'MailerLite-Segment', type: 'text' },
  { key: 'notiz', label: 'Notiz', type: 'textarea' },
]

export function lizenzFields(produkte: string[]): Field[] {
  return [
    { key: 'produkt', label: 'Produkt / Tarif', type: 'text', required: true, suggestions: produkte },
    { key: 'start', label: 'Start', type: 'date' },
    { key: 'ende', label: 'Ende', type: 'date' },
    { key: 'kuendigungsfrist_tage', label: 'Kündigungsfrist (Tage)', type: 'number' },
    { key: 'betrag_chf', label: 'Betrag CHF / Jahr', type: 'number' },
    { key: 'abrechnungsintervall', label: 'Abrechnungsintervall', type: 'select', options: INTERVALLE },
    { key: 'preismodell', label: 'Preismodell', type: 'textarea' },
    { key: 'notiz', label: 'Notiz', type: 'textarea' },
  ]
}

export const aboStandFields: Field[] = [
  { key: 'stichtag', label: 'Stichtag', type: 'date', required: true },
  { key: 'anzahl_aktive_abos', label: 'Aktive Abos', type: 'number', required: true },
  { key: 'notiz', label: 'Notiz', type: 'textarea' },
]

export function modulFields(module: string[]): Field[] {
  return [
    { key: 'modul', label: 'Modul', type: 'text', required: true, suggestions: module },
    { key: 'aktiv_seit', label: 'Aktiv seit', type: 'date' },
  ]
}

export const avvFields: Field[] = [
  { key: 'version', label: 'Version', type: 'text', required: true },
  { key: 'unterzeichnet_am', label: 'Unterzeichnet am', type: 'date' },
  { key: 'ablage_link', label: 'Ablage (Link)', type: 'url' },
  { key: 'subunternehmer_stand', label: 'Stand Subunternehmer', type: 'date' },
]

export const projektFields: Field[] = [
  { key: 'titel', label: 'Titel', type: 'text', required: true },
  { key: 'status', label: 'Status', type: 'select', required: true, options: PROJEKT_STATUS },
  { key: 'offerte_chf', label: 'Offerte CHF', type: 'number' },
  { key: 'start', label: 'Start', type: 'date' },
  { key: 'ende', label: 'Ende', type: 'date' },
  { key: 'notiz', label: 'Notiz', type: 'textarea' },
]

export function wiedervorlageFields(kontakte: Kontakt[]): Field[] {
  return [
    { key: 'faellig_am', label: 'Fällig am', type: 'date', required: true },
    { key: 'kontakt_id', label: 'Kontakt', type: 'select', options: kontakte.map(k => ({ value: String(k.id), label: k.name })) },
    { key: 'text', label: 'Was ist zu tun?', type: 'textarea', required: true },
  ]
}

export const dokumentFields: Field[] = [
  { key: 'titel', label: 'Titel', type: 'text', required: true },
  { key: 'typ', label: 'Typ', type: 'select', required: true, options: DOKUMENT_TYPEN },
  { key: 'datum', label: 'Datum', type: 'date' },
  { key: 'bemerkung', label: 'Bemerkung', type: 'textarea' },
]
