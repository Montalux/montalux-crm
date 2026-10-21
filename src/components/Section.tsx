import { useState } from 'react'
import { RecordModal, type Field, type Values } from './RecordForm'
import { deleteRecord, saveRecord } from '../hooks/useData'
import { IconButton } from './ui'

export interface Column<T> {
  label: string
  render: (row: T) => React.ReactNode
  className?: string
}

// Table of child records of a Firma with add/edit/delete via RecordModal
export function Section<T extends { id: number }>({ title, table, firmaId, rows, columns, fields, onChanged, deleteLabel, actions }: {
  title: string
  table: string
  firmaId: number
  rows: T[]
  columns: Column<T>[]
  fields: Field[]
  onChanged: () => void
  deleteLabel: (row: T) => string
  actions?: (row: T) => React.ReactNode // extra buttons before Bearbeiten/Löschen
}) {
  const [editing, setEditing] = useState<Values | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = async (values: Values) => {
    const id = editing?.id as number | undefined
    const { error } = await saveRecord(table, id ? values : { ...values, firma_id: firmaId }, id)
    if (!error) onChanged()
    return error
  }

  const remove = async (row: T) => {
    if (!confirm(`«${deleteLabel(row)}» löschen?`)) return
    const err = await deleteRecord(table, row.id)
    setError(err)
    if (!err) onChanged()
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <div className="flex items-center justify-between gap-2">
          <h3 className="card-title text-base">{title}</h3>
          <button className="btn btn-sm btn-primary" onClick={() => setEditing({})}>Hinzufügen</button>
        </div>
        {error && <div className="alert alert-error"><span>{error}</span></div>}
        {rows.length === 0 ? <p className="text-sm opacity-60">Noch nichts erfasst.</p> : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>{columns.map(c => <th key={c.label} className={c.className}>{c.label}</th>)}<th /></tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    {columns.map(c => <td key={c.label} className={c.className}>{c.render(r)}</td>)}
                    <td className="whitespace-nowrap text-right">
                      {actions?.(r)}
                      <IconButton icon="edit" label="Bearbeiten" onClick={() => setEditing(r as unknown as Values)} />
                      <IconButton icon="delete" label="Löschen" danger onClick={() => remove(r)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <RecordModal
        title={`${title}: ${editing?.id ? 'bearbeiten' : 'hinzufügen'}`}
        fields={fields}
        record={editing}
        onClose={() => setEditing(null)}
        onSave={save}
      />
    </div>
  )
}
