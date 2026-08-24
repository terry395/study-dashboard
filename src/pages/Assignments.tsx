import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ClipboardList, Plus, Pencil, Trash2, CheckCircle2, Circle,
  Search, Filter, ChevronDown,
} from 'lucide-react'
import {
  getAssignments, createAssignment, updateAssignment,
  deleteAssignment, setGroupMembers, updateAssignmentStatus,
} from '@/services/assignments'
import { getModules } from '@/services/modules'
import type { Assignment, Module } from '@/types'
import type { AssignmentInsert } from '@/services/assignments'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PageLoader } from '@/components/LoadingSpinner'
import { Alert } from '@/components/Alert'
import { getDeadlineInfo, getDeadlineBadgeClass, formatDate, formatTime } from '@/utils'
import { AssignmentForm } from '@/components/AssignmentForm'

const STATUS_ORDER: Assignment['status'][] = ['Not Started', 'In Progress', 'Submitted', 'Completed']

export default function Assignments() {
  const [assignments,   setAssignments]   = useState<Assignment[]>([])
  const [modules,       setModules]       = useState<Module[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [formOpen,      setFormOpen]      = useState(false)
  const [editing,       setEditing]       = useState<Assignment | null>(null)
  const [deleteTarget,  setDeleteTarget]  = useState<Assignment | null>(null)
  const [search,        setSearch]        = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')
  const [filterModule,  setFilterModule]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [aRes, mRes] = await Promise.all([getAssignments(), getModules()])
    setLoading(false)
    if (aRes.error) { setError('Failed to load assignments.'); return }
    setAssignments(aRes.data)
    setModules(mRes.data)
  }, [])

  useEffect(() => { load() }, [load])

  // Filtered assignments
  const filtered = useMemo(() => {
    let list = assignments
    if (search)       list = list.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    if (filterStatus) list = list.filter(a => a.status === filterStatus)
    if (filterModule) list = list.filter(a => a.module_id === filterModule)
    return list
  }, [assignments, search, filterStatus, filterModule])

  async function handleSave(payload: AssignmentInsert, memberNames: string[]) {
    if (editing) {
      const { error } = await updateAssignment(editing.id, payload)
      if (error) throw new Error(error.message)
      await setGroupMembers(editing.id, memberNames)
    } else {
      const { data, error } = await createAssignment(payload)
      if (error) throw new Error(error.message)
      if (data) await setGroupMembers(data.id, memberNames)
    }
    setFormOpen(false)
    setEditing(null)
    await load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteAssignment(deleteTarget.id)
    setDeleteTarget(null)
    await load()
  }

  async function cycleStatus(a: Assignment) {
    const idx  = STATUS_ORDER.indexOf(a.status)
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
    setAssignments(prev => prev.map(x => x.id === a.id ? { ...x, status: next } : x))
    await updateAssignmentStatus(a.id, next)
  }

  if (loading) return <PageLoader />

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Assignments</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
            {assignments.length} total · {assignments.filter(a => a.status !== 'Completed' && a.status !== 'Submitted').length} active
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }} id="add-assignment-btn">
          <Plus size={15} /> Add assignment
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.4rem 0.75rem',
          flex: 1, minWidth: 200,
        }}>
          <Search size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search assignments…"
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--color-text-primary)', width: '100%' }}
          />
        </div>

        {/* Status filter */}
        <select
          className="input" style={{ width: 'auto', minWidth: 140 }}
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Module filter */}
        <select
          className="input" style={{ width: 'auto', minWidth: 160 }}
          value={filterModule} onChange={e => setFilterModule(e.target.value)}
        >
          <option value="">All modules</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Empty state */}
      {assignments.length === 0 && (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <ClipboardList size={48} />
          <h3>No assignments yet</h3>
          <p>Add your first assignment to start tracking deadlines.</p>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus size={15} /> Add assignment
          </button>
        </div>
      )}

      {/* No results from filter */}
      {assignments.length > 0 && filtered.length === 0 && (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <Filter size={40} />
          <h3>No results</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Assignment list */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(a => (
            <AssignmentRow
              key={a.id}
              assignment={a}
              onEdit={() => { setEditing(a); setFormOpen(true) }}
              onDelete={() => setDeleteTarget(a)}
              onCycleStatus={() => cycleStatus(a)}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? 'Edit assignment' : 'Add assignment'}
        maxWidth="600px"
      >
        <AssignmentForm
          initial={editing}
          modules={modules}
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete assignment"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ── Assignment row card ────────────────────────────────────────────────────────

interface RowProps {
  assignment: Assignment
  onEdit: () => void
  onDelete: () => void
  onCycleStatus: () => void
}

function AssignmentRow({ assignment: a, onEdit, onDelete, onCycleStatus }: RowProps) {
  const dl = getDeadlineInfo(a.due_date, a.due_time)
  const isComplete = a.status === 'Completed' || a.status === 'Submitted'

  return (
    <div className="card-sm" style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      opacity: isComplete ? 0.65 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Status toggle */}
      <button
        onClick={onCycleStatus}
        className="btn btn-ghost btn-icon"
        title={`Status: ${a.status} — click to advance`}
        style={{ flexShrink: 0, color: isComplete ? 'var(--color-success)' : 'var(--color-text-muted)' }}
      >
        {isComplete
          ? <CheckCircle2 size={20} />
          : <Circle size={20} />
        }
      </button>

      {/* Module colour dot + info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          {a.module && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: 'var(--color-text-muted)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.module.colour }} />
              {a.module.name}
            </div>
          )}
          <span style={{
            fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
            color: 'var(--color-text-muted)', letterSpacing: '0.04em',
          }}>
            {a.assignment_type}
          </span>
          {a.weightage && (
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
              {a.weightage}%
            </span>
          )}
        </div>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: 'var(--color-text-primary)',
          textDecoration: isComplete ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {a.name}
        </div>
      </div>

      {/* Due date */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {formatDate(a.due_date)}{a.due_time ? ` · ${formatTime(a.due_time)}` : ''}
        </div>
        {!isComplete && (
          <span className={getDeadlineBadgeClass(dl.status)} style={{ marginTop: 3 }}>
            {dl.label}
          </span>
        )}
      </div>

      {/* Status badge */}
      <StatusBadge status={a.status} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} title="Edit">
          <Pencil size={13} />
        </button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete} title="Delete">
          <Trash2 size={13} style={{ color: 'var(--color-danger)' }} />
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Assignment['status'] }) {
  const map: Record<Assignment['status'], string> = {
    'Not Started': 'badge badge-neutral',
    'In Progress': 'badge badge-info',
    'Submitted':   'badge badge-warning',
    'Completed':   'badge badge-success',
  }
  return <span className={map[status]}>{status}</span>
}

// Unused import suppression
const _unused = { ChevronDown }; void _unused
