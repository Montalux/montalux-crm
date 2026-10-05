import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AboStand, Customer, Dokument, FirmaFull, Projekt, StundenMonat } from '../types/database'

const FIRMA_SELECT = '*, kontakt(*), lizenz(*), modul(*), avv(*), wiedervorlage(*)'

// --- Firmen (overview, export, import) ---
export function useFirmen() {
  const [firmen, setFirmen] = useState<FirmaFull[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    supabase.from('firma').select(FIRMA_SELECT).order('name').then(({ data, error }) => {
      setError(error ? error.message : null)
      setFirmen((data as FirmaFull[] | null) ?? [])
      setLoading(false)
    })
  }, [reload])

  const refetch = useCallback(() => setReload(n => n + 1), [])
  return { firmen, loading, error, refetch }
}

// --- Firma detail incl. Vertrag/Projekte/Dokumente/Stunden ---
export interface FirmaDetail extends FirmaFull {
  abo_stand: AboStand[]
  projekt: Projekt[]
  dokument: Dokument[]
}

export function useFirma(id: number) {
  const [firma, setFirma] = useState<FirmaDetail | null>(null)
  const [stunden, setStunden] = useState<StundenMonat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    Promise.all([
      supabase.from('firma').select(`${FIRMA_SELECT}, abo_stand(*), projekt(*), dokument(*)`).eq('id', id).maybeSingle(),
      supabase.from('firma_stunden_monat').select('*').eq('firma_id', id).order('monat', { ascending: false }).limit(12),
    ]).then(([f, s]) => {
      setError(f.error?.message ?? s.error?.message ?? null)
      setFirma((f.data as FirmaDetail | null) ?? null)
      setStunden((s.data as StundenMonat[] | null) ?? [])
      setLoading(false)
    })
  }, [id, reload])

  const refetch = useCallback(() => setReload(n => n + 1), [])
  return { firma, stunden, loading, error, refetch }
}

// --- Timetracker customers (for linking a Firma) ---
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    supabase.from('customers').select('*').order('name').then(({ data }) => setCustomers(data ?? []))
  }, [])

  return customers
}

// --- Mutations ---
export async function saveRecord(table: string, values: Record<string, unknown>, id?: number) {
  const { data, error } = id
    ? await supabase.from(table).update(values).eq('id', id).select('id').single()
    : await supabase.from(table).insert(values).select('id').single()
  return { id: (data as { id: number } | null)?.id ?? null, error: error?.message ?? null }
}

export async function deleteRecord(table: string, id: number) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  return error?.message ?? null
}
