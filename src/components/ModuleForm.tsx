import { useState, type FormEvent } from 'react'
import type { Module } from '@/types'
import type { ModuleInsert } from '@/services/modules'
import { MODULE_COLORS, randomModuleColor } from '@/utils'
import { Alert } from '@/components/Alert'

interface ModuleFormProps {
  initial?: Module | null
  onSave: (data: ModuleInsert) => Promise<void>
  onCancel: () => void
}

export function ModuleForm({ initial, onSave, onCancel }: ModuleFormProps) {
  const [name,          setName]          = useState(initial?.name           ?? '')
  const [code,          setCode]          = useState(initial?.code           ?? '')
  const [lecturerName,  setLecturerName]  = useState(initial?.lecturer_name  ?? '')
  const [lecturerEmail, setLecturerEmail] = useState(initial?.lecturer_email ?? '')
  const [description,   setDescription]   = useState(initial?.description    ?? '')
  const [academicYear,  setAcademicYear]  = useState(initial?.academic_year  ?? '')
  const [semester,      setSemester]      = useState(initial?.semester       ?? '')
  const [colour,        setColour]        = useState(initial?.colour         ?? randomModuleColor())
  const [error,         setError]         = useState('')
  const [loading,       setLoading]       = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Module name is required.'); return }
    setError('')
    setLoading(true)
    try {
      await onSave({
        name:           name.trim(),
        code:           code.trim()          || null,
        lecturer_name:  lecturerName.trim()  || null,
        lecturer_email: lecturerEmail.trim() || null,
        description:    description.trim()   || null,
        academic_year:  academicYear.trim()  || null,
        semester:       semester.trim()      || null,
        colour,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <Alert type="error" message={error} />}

      {/* Name + Code row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="mod-name">Module name *</label>
          <input
            id="mod-name" className="input" type="text"
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Engineering Mathematics" required
          />
        </div>
        <div className="form-group" style={{ width: 100 }}>
          <label className="label" htmlFor="mod-code">Code</label>
          <input
            id="mod-code" className="input" type="text"
            value={code} onChange={e => setCode(e.target.value)}
            placeholder="ENG201"
          />
        </div>
      </div>

      {/* Lecturer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="mod-lname">Lecturer name</label>
          <input
            id="mod-lname" className="input" type="text"
            value={lecturerName} onChange={e => setLecturerName(e.target.value)}
            placeholder="Mr Tan"
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="mod-lemail">Lecturer email</label>
          <input
            id="mod-lemail" className="input" type="email"
            value={lecturerEmail} onChange={e => setLecturerEmail(e.target.value)}
            placeholder="lecturer@uni.edu"
          />
        </div>
      </div>

      {/* Academic year + Semester */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="mod-year">Academic year</label>
          <input
            id="mod-year" className="input" type="text"
            value={academicYear} onChange={e => setAcademicYear(e.target.value)}
            placeholder="2026"
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="mod-sem">Semester</label>
          <input
            id="mod-sem" className="input" type="text"
            value={semester} onChange={e => setSemester(e.target.value)}
            placeholder="Semester 2"
          />
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="label" htmlFor="mod-desc">Description</label>
        <textarea
          id="mod-desc" className="input"
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Brief description of the module…"
          rows={2} style={{ resize: 'vertical' }}
        />
      </div>

      {/* Colour picker */}
      <div className="form-group">
        <label className="label">Colour</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MODULE_COLORS.map(c => (
            <button
              key={c} type="button"
              onClick={() => setColour(c)}
              aria-label={`Select colour ${c}`}
              style={{
                width: 28, height: 28,
                borderRadius: '50%',
                background: c,
                border: colour === c ? '3px solid var(--color-text-primary)' : '2px solid transparent',
                outline: colour === c ? '2px solid var(--color-text-muted)' : 'none',
                outlineOffset: 2,
                cursor: 'pointer',
                transition: 'transform 0.1s',
                transform: colour === c ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Footer buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save changes' : 'Create module'}
        </button>
      </div>
    </form>
  )
}
