import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCustomers, useFirma, useFirmen, saveRecord, deleteRecord, type FirmaDetail } from '../hooks/useData'
import { useFlash } from '../hooks/useFlash'
import { supabase } from '../lib/supabase'
import { BUCKET, chf, dt, kuendigungInfo, KUENDIGUNG_FARBE, KUENDIGUNG_LABEL, tausender } from '../lib/crm'
import {
  aboStandFields, avvFields, firmaFields, kontaktFields, lizenzFields, modulFields, projektFields, wiedervorlageFields,
} from '../lib/fields'
import { RecordFields, RecordModal, type Values } from '../components/RecordForm'
import { toDb, toForm } from '../lib/form'
import { formatTelefon, toUrl } from '../lib/mask'
import { downloadVcard } from '../lib/vcard'
import { Section } from '../components/Section'
import { Dokumente } from '../components/Dokumente'
import { ErfasstBadges, KuendigungHinweise } from '../components/FirmaInfo'
import { Flash, IconButton, RollenBadges, Spinner, StatusBadge } from '../components/ui'
import type { AboStand, Avv, Kontakt, Lizenz, Modul, Projekt, StundenMonat, Wiedervorlage } from '../types/database'

const TABS = ['Kontakte', 'Vertrag', 'Projekte', 'Dokumente', 'Stunden'] as const
type Tab = typeof TABS[number]

export default function FirmaPage() {
  const { id } = useParams()
  if (id === 'neu') return <NeueFirma />
  return <FirmaDetailPage key={id} id={Number(id)} />
}

function NeueFirma() {
  const customers = useCustomers()
  const fields = useMemo(() => firmaFields(customers), [customers])
  const [form, setForm] = useState(() => toForm(fields, { status: 'Kunde' }))
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { id, error } = await saveRecord('firma', toDb(fields, form))
    if (error) setError(error)
    else navigate(`/firma/${id}`)
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <form className="card-body" onSubmit={submit}>
        <h2 className="card-title">Neue Firma</h2>
        {error && <div className="alert alert-error"><span>{error}</span></div>}
        <RecordFields fields={fields} form={form} setForm={setForm} />
        <div className="card-actions justify-end">
          <Link to="/" className="btn btn-ghost">Abbrechen</Link>
          <button type="submit" className="btn btn-primary">Speichern</button>
        </div>
      </form>
    </div>
  )
}

function FirmaDetailPage({ id }: { id: number }) {
  const { firma, stunden, loading, error, refetch } = useFirma(id)
  const { firmen } = useFirmen() // suggestions for Produkt/Modul across all firms
  const customers = useCustomers()
  const { flash, show, dismiss } = useFlash()
  const [tab, setTab] = useState<Tab>('Kontakte')
  const [editStamm, setEditStamm] = useState<Values | null>(null)
  const [neueWv, setNeueWv] = useState<Values | null>(null)
  const navigate = useNavigate()

  const produkte = useMemo(() => [...new Set(firmen.flatMap(f => f.lizenz.map(l => l.produkt)))].sort(), [firmen])
  const module = useMemo(() => [...new Set(firmen.flatMap(f => f.modul.map(m => m.modul)))].sort(), [firmen])
  const stammFields = useMemo(() => firmaFields(customers), [customers])

  if (loading) return <Spinner />
  if (error) return <div className="alert alert-error"><span>{error}</span></div>
  if (!firma) return <div className="alert"><span>Firma nicht gefunden. <Link to="/" className="link">Zur Übersicht</Link></span></div>

  const customer = customers.find(c => c.id === firma.customer_id)
  const offeneWv = firma.wiedervorlage.filter(w => !w.erledigt).sort((a, b) => a.faellig_am.localeCompare(b.faellig_am))

  const deleteFirma = async () => {
    if (!confirm(`Firma «${firma.name}» mit allen Kontakten, Lizenzen, Modulen, AVV, Projekten, Wiedervorlagen und Dokumenten löschen?`)) return
    const paths = firma.dokument.map(d => d.storage_path).filter((p): p is string => !!p)
    if (paths.length) {
      const { error } = await supabase.storage.from(BUCKET).remove(paths)
      if (error) { show('error', `Dateien konnten nicht gelöscht werden: ${error.message}`); return }
    }
    const err = await deleteRecord('firma', firma.id)
    if (err) show('error', err)
    else navigate('/')
  }

  const erledigt = async (w: Wiedervorlage) => {
    const { error } = await saveRecord('wiedervorlage', { erledigt: true }, w.id)
    if (error) show('error', error)
    else refetch()
  }

  return (
    <>
      <Flash flash={flash} onDismiss={dismiss} />

      {/* Kopf: Stammdaten, Erfasst im CRM, Kündigung, Wiedervorlagen */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="card-title text-2xl">{firma.name}</h1>
            {firma.kuerzel && <span className="badge badge-outline">{firma.kuerzel}</span>}
            <StatusBadge status={firma.status} />
            <div className="ml-auto flex gap-1">
              <button className="btn btn-sm" onClick={() => setEditStamm({ ...firma })}>Bearbeiten</button>
              <button className="btn btn-sm btn-ghost text-error" onClick={deleteFirma}>Löschen</button>
            </div>
          </div>

          <div className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Tenant" value={firma.tenant} link />
            <Info label="Telefon Zentrale" value={firma.telefon_zentrale && formatTelefon(firma.telefon_zentrale)} />
            <Info label="Timetracker-Kunde" value={customer?.name} />
            <Info label="Strahlhorn-User" value={firma.anzahl_strahlhorn_user?.toString()} />
            <Info label="Adresse" value={firma.adresse} pre />
            {firma.notiz && <div className="sm:col-span-2 lg:col-span-4"><Info label="Notiz" value={firma.notiz} pre /></div>}
          </div>

          <ErfasstBadges firma={firma} />
          <KuendigungHinweise firma={firma} />

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">Wiedervorlagen</h3>
              <button className="btn btn-xs btn-primary" onClick={() => setNeueWv({})}>Neu</button>
            </div>
            {offeneWv.length === 0 ? <p className="text-sm opacity-60">Keine offenen Wiedervorlagen.</p> : (
              <ul className="space-y-1">
                {offeneWv.map(w => (
                  <li key={w.id} className="flex items-start gap-2 text-sm">
                    <input type="checkbox" className="checkbox checkbox-sm mt-0.5" title="Erledigt" onChange={() => erledigt(w)} />
                    <span className="font-medium whitespace-nowrap">{dt(w.faellig_am)}</span>
                    <span>{w.text}{w.kontakt_id && ` (${firma.kontakt.find(k => k.id === w.kontakt_id)?.name ?? ''})`}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-border mb-4 overflow-x-auto flex-nowrap">
        {TABS.map(t => (
          <button key={t} role="tab" className={`tab ${tab === t ? 'tab-active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="space-y-6">
        {tab === 'Kontakte' && (
          <Section<Kontakt>
            title="Kontakte" table="kontakt" firmaId={firma.id} onChanged={refetch}
            rows={[...firma.kontakt].sort((a, b) => a.name.localeCompare(b.name))}
            fields={kontaktFields}
            deleteLabel={k => k.name}
            columns={[
              { label: 'Name', render: k => k.name },
              { label: 'Funktion', render: k => k.funktion },
              { label: 'Rollen', render: k => <RollenBadges rollen={k.rollen} /> },
              { label: 'E-Mail', render: k => k.email && <a className="link link-hover" href={`mailto:${k.email}`}>{k.email}</a> },
              { label: 'Telefon direkt', render: k => k.telefon && <span className="whitespace-nowrap">{formatTelefon(k.telefon)}</span> },
              { label: 'Mobile', render: k => k.mobile && <span className="whitespace-nowrap">{formatTelefon(k.mobile)}</span> },
              { label: 'Segment', render: k => k.ml_segment },
            ]}
            actions={k => <IconButton icon="vcard" label="vCard herunterladen" onClick={() => downloadVcard(k, firma)} />}
          />
        )}

        {tab === 'Vertrag' && <VertragTab firma={firma} produkte={produkte} module={module} onChanged={refetch} />}

        {tab === 'Projekte' && (
          <Section<Projekt>
            title="Projekte" table="projekt" firmaId={firma.id} onChanged={refetch}
            rows={[...firma.projekt].sort((a, b) => (b.start ?? '').localeCompare(a.start ?? ''))}
            fields={projektFields}
            deleteLabel={p => p.titel}
            columns={[
              { label: 'Titel', render: p => p.titel },
              { label: 'Status', render: p => p.status },
              { label: 'Offerte', render: p => chf(p.offerte_chf), className: 'text-right' },
              { label: 'Start', render: p => dt(p.start) },
              { label: 'Ende', render: p => dt(p.ende) },
            ]}
          />
        )}

        {tab === 'Dokumente' && <Dokumente firmaId={firma.id} rows={firma.dokument} onChanged={refetch} />}

        {tab === 'Stunden' && <StundenTab stunden={stunden} verknuepft={firma.customer_id !== null} />}
      </div>

      <RecordModal
        title="Stammdaten bearbeiten"
        fields={stammFields}
        record={editStamm}
        onClose={() => setEditStamm(null)}
        onSave={async values => {
          const { error } = await saveRecord('firma', values, firma.id)
          if (!error) refetch()
          return error
        }}
      />
      <RecordModal
        title="Neue Wiedervorlage"
        fields={wiedervorlageFields(firma.kontakt)}
        record={neueWv}
        onClose={() => setNeueWv(null)}
        onSave={async values => {
          const { error } = await saveRecord('wiedervorlage', { ...values, firma_id: firma.id })
          if (!error) refetch()
          return error
        }}
      />
    </>
  )
}

function Info({ label, value, pre, link }: { label: string; value: string | null | undefined; pre?: boolean; link?: boolean }) {
  return (
    <div>
      <div className="text-xs opacity-60">{label}</div>
      {link && value
        ? <a className="link break-all" href={toUrl(value)} target="_blank" rel="noopener noreferrer">{value.replace(/^https?:\/\//i, '')}</a>
        : <div className={pre ? 'whitespace-pre-line' : ''}>{value || '–'}</div>}
    </div>
  )
}

function VertragTab({ firma, produkte, module, onChanged }: {
  firma: FirmaDetail
  produkte: string[]
  module: string[]
  onChanged: () => void
}) {
  // Newest first; delta against the next older entry
  const aboStand = [...firma.abo_stand].sort((a, b) => b.stichtag.localeCompare(a.stichtag))
  const delta = (a: AboStand) => {
    const prev = aboStand[aboStand.indexOf(a) + 1]
    if (!prev) return ''
    const d = a.anzahl_aktive_abos - prev.anzahl_aktive_abos
    return d === 0 ? '±0' : `${d > 0 ? '+' : '−'}${tausender(Math.abs(d))}`
  }

  return (
    <>
      <Section<Lizenz>
        title="Lizenzen" table="lizenz" firmaId={firma.id} onChanged={onChanged}
        rows={[...firma.lizenz].sort((a, b) => (a.ende ?? '').localeCompare(b.ende ?? ''))}
        fields={lizenzFields(produkte)}
        deleteLabel={l => l.produkt}
        columns={[
          { label: 'Produkt', render: l => l.produkt },
          { label: 'Start', render: l => dt(l.start) },
          { label: 'Ende', render: l => dt(l.ende) },
          { label: 'Frist', render: l => l.kuendigungsfrist_tage !== null ? `${l.kuendigungsfrist_tage} Tage` : '' },
          {
            label: 'Kündigen bis', render: l => {
              const k = kuendigungInfo(l)
              return k && <span className={`badge badge-sm badge-soft ${KUENDIGUNG_FARBE[k.state]}`}>{dt(k.date)} · {KUENDIGUNG_LABEL[k.state]}</span>
            },
          },
          { label: 'Betrag/Jahr', render: l => chf(l.betrag_chf), className: 'text-right' },
          { label: 'Abrechnung', render: l => l.abrechnungsintervall },
          { label: 'Preismodell', render: l => <span className="whitespace-pre-line">{l.preismodell}</span> },
        ]}
      />
      <Section<AboStand>
        title="Abo-Stand" table="abo_stand" firmaId={firma.id} onChanged={onChanged}
        rows={aboStand}
        fields={aboStandFields}
        deleteLabel={a => `Stand ${dt(a.stichtag)}`}
        columns={[
          { label: 'Stichtag', render: a => dt(a.stichtag) },
          { label: 'Aktive Abos', render: a => tausender(a.anzahl_aktive_abos), className: 'text-right' },
          { label: 'Veränderung', render: delta, className: 'text-right' },
          { label: 'Notiz', render: a => a.notiz },
        ]}
      />
      <Section<Modul>
        title="Module" table="modul" firmaId={firma.id} onChanged={onChanged}
        rows={[...firma.modul].sort((a, b) => a.modul.localeCompare(b.modul))}
        fields={modulFields(module)}
        deleteLabel={m => m.modul}
        columns={[
          { label: 'Modul', render: m => m.modul },
          { label: 'Aktiv seit', render: m => dt(m.aktiv_seit) },
        ]}
      />
      <Section<Avv>
        title="AVV" table="avv" firmaId={firma.id} onChanged={onChanged}
        rows={[...firma.avv].sort((a, b) => (b.unterzeichnet_am ?? '').localeCompare(a.unterzeichnet_am ?? ''))}
        fields={avvFields}
        deleteLabel={a => `AVV ${a.version}`}
        columns={[
          { label: 'Version', render: a => a.version },
          { label: 'Unterzeichnet', render: a => dt(a.unterzeichnet_am) },
          { label: 'Ablage', render: a => a.ablage_link && <a className="link" href={a.ablage_link} target="_blank" rel="noopener noreferrer">Öffnen</a> },
          { label: 'Stand Subunternehmer', render: a => dt(a.subunternehmer_stand) },
        ]}
      />
    </>
  )
}

function StundenTab({ stunden, verknuepft }: { stunden: StundenMonat[]; verknuepft: boolean }) {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h3 className="card-title text-base">Stunden pro Monat (Timetracker)</h3>
        {!verknuepft ? (
          <p className="text-sm opacity-70">Kein Timetracker-Kunde zugeordnet. Unter «Bearbeiten» in den Stammdaten auswählen.</p>
        ) : stunden.length === 0 ? (
          <p className="text-sm opacity-70">Keine Buchungen.</p>
        ) : (
          <table className="table table-sm w-auto">
            <thead><tr><th>Monat</th><th className="text-right">Stunden</th></tr></thead>
            <tbody>
              {stunden.map(s => (
                <tr key={s.monat}>
                  <td>{s.monat.slice(5, 7)}.{s.monat.slice(0, 4)}</td>
                  <td className="text-right">{Number(s.stunden).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
