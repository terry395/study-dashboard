import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import type { Assignment, Module } from '@/types'
import type { AssignmentInsert } from '@/services/assignments'
import { Alert } from '@/components/Alert'
import { format } from 'date-fns'

interface AssignmentFormProps {
  initial?: Assignment | null
  modules: Module[]
  onSave: (data: AssignmentInsert, memberNames: string[]) => Promise<void>
  onCancel: () => void
}

export function AssignmentForm({ initial, modules, onSave, onCancel }: AssignmentFormProps) {
  const [name,       setName]       = useState(initial?.name            ?? '')
  const [moduleId,   setModuleId]   = useState(initial?.module_id       ?? '')
  const [dueDate,    setDueDate]    = useState(initial?.due_date        ?? format(new Date(), 'yyyy-MM-dd'))
  const [dueTime,    setDueTime]    = useState(initial?.due_time        ?? '23:59')
  const [status,     setStatus]     = useState<Assignment['status']>(initial?.status ?? 'Not Started')
  const [aType,      setAType]      = useState<Assignment['assignment_type']>(initial?.assignment_type ?? 'Individual')
  const [weightage,  setWeightage]  = useState(initial?.weightage?.toString() ?? '')
  const [description,setDescription]= useState(initial?.description    ?? '')
  const [notes,      setNotes]      = useState(initial?.notes           ?? '')
  const [members,    setMembers]    = useState<string[]>(initial?.group_members?.map(m => m.name) ?? [])
  const [newMember,  setNewMember]  = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  function addMember() {
    const name = newMember.trim()
    if (!name || members.includes(name)) return
    setMembers(prev => [...prev, name])
    setNewMember('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Assignment name is required.'); return }
    if (!moduleId)    { setError('Please select a module.'); return }
    if (!dueDate)     { setError('Due date is required.'); return }
    setError('')
    setLoading(true)
    try {
      await onSave({
        name:            name.trim(),
        module_id:       moduleId || null,
        due_date:        dueDate,
        due_time:        dueTime || null,
        status,
        assignment_type: aType,
        weightage:       weightage ? parseFloat(weightage) : null,
        description:     description.trim() || null,
        notes:           notes.trim() || null,
      }, members)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <Alert type="error" message={error} />}

      {/* Name */}
      <div className="form-group">
        <label className="label" htmlFor="asn-name">
          Assignment name <span className="required-star">*</span>
        </label>
        <input id="asn-name" className="input" type="text" value={name}
          onChange={e => setName(e.target.value)} placeholder="Assignment 2" required />
      </div>

      {/* Module */}
      <div className="form-group">
        <label className="label" htmlFor="asn-module">
          Module <span className="required-star">*</span>
        </label>
        <select id="asn-module" className="input" value={moduleId} onChange={e => setModuleId(e.target.value)}
          style={{ borderColor: !moduleId ? 'var(--color-border-light)' : undefined }}>
          <option value="" disabled>— Select a module —</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Due date + time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="asn-date">
            Due date <span className="required-star">*</span>
          </label>
          <input id="asn-date" className="input" type="date" value={dueDate}
            onChange={e => setDueDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="asn-time">Due time</label>
          <input id="asn-time" className="input" type="time" value={dueTime}
            onChange={e => setDueTime(e.target.value)} />
        </div>
      </div>

      {/* Status + Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="asn-status">Status</label>
          <select id="asn-status" className="input" value={status} onChange={e => setStatus(e.target.value as Assignment['status'])}>
            {(['Not Started','In Progress','Submitted','Completed'] as const).map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
        </div>
        <div className="form-group">
          <label className="label" htmlFor="asn-type">Type</label>
          <select id="asn-type" className="input" value={aType} onChange={e => setAType(e.target.value as Assignment['assignment_type'])}>
            <option value="Individual">Individual</option>
            <option value="Group">Group</option>
          </select>
        </div>
      </div>

      {/* Weightage */}
      <div className="form-group">
        <label className="label" htmlFor="asn-weight">Weightage (%)</label>
        <input id="asn-weight" className="input" type="number" min="0" max="100" step="0.5"
          value={weightage} onChange={e => setWeightage(e.target.value)} placeholder="20" />
      </div>

      {/* Group members (only for Group type) */}
      {aType === 'Group' && (
        <div className="form-group">
          <label className="label">Group members</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {members.map(m => (
              <span key={m} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: 12,
              }}>
                {m}
                <button type="button" onClick={() => setMembers(prev => prev.filter(x => x !== m))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0, lineHeight: 1 }}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="input" type="text" value={newMember}
              onChange={e => setNewMember(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMember() } }}
              placeholder="Add member name…" style={{ flex: 1 }} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={addMember}>
              <Plus size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="form-group">
        <label className="label" htmlFor="asn-desc">Description</label>
        <textarea id="asn-desc" className="input" value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What is this assignment about?" rows={2} style={{ resize: 'vertical' }} />
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="label" htmlFor="asn-notes">Notes</label>
        <textarea id="asn-notes" className="input" value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any personal notes…" rows={2} style={{ resize: 'vertical' }} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save changes' : 'Add assignment'}
        </button>
      </div>
    </form>
  )
}
