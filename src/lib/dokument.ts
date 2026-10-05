import { supabase } from './supabase'
import { BUCKET } from './crm'
import type { Dokument } from '../types/database'

export async function openDokument(d: Dokument) {
  if (d.url) { window.open(d.url, '_blank', 'noopener'); return }
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(d.storage_path!, 60)
  if (error) alert(`Download fehlgeschlagen: ${error.message}`)
  else window.open(data.signedUrl, '_blank', 'noopener')
}
