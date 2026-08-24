import { useState, useEffect, useCallback } from 'react'
import { FlaskConical, Plus, Pencil, Trash2, MapPin, Clock } from 'lucide-react'
import { getTests, createTest, updateTest, deleteTest } from '@/services/tests'
import { getModules } from '@/services/modules'
import type { Test, Module } from '@/types'
import type { TestInsert } from '@/services/tests'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PageLoader } from '@/components/LoadingSpinner'
import { Alert } from '@/components/Alert'
import { TestForm } from '@/components/TestForm'
import { formatDate, formatTime } from '@/utils'
import { differenceInCalendarDays, parseISO, isPast } from 'date-fns'

export default function Tests() {
  const [tests,        setTests]        = useState<Test[]>([])
  const [modules,      setModules]      = useState<Module[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [formOpen,     setFormOpen]     = useState(false)
  const [editing,      setEditing]      = useState<Test | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Test | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [tRes, mRes] = await Promise.all([getTests(), getModules()])
    setLoading(false)
    if (tRes.error) { setError('Failed to load tests.'); return }
    setTests(tRes.data)
    setModules(mRes.data)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(payload: TestInsert) {
    if (editing) {
      const { error } = await updateTest(editing.id, payload)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await createTest(payload)
      if (error) throw new Error(error.message)
    }
    setFormOpen(false)
    setEditing(null)
    await load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteTest(deleteTarget.id)
    setDeleteTarget(null)
    await load()
  }

  if (loading) return <PageLoader />

  const upcoming = tests.filter(t => !isPast(parseISO(`${t.date}T${t.start_time}`)))
  const past     = tests.filter(t =>  isPast(parseISO(`${t.date}T${t.start_time}`)))

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Tests</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }} id="add-test-btn">
          <Plus size={15} /> Add test
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {tests.length === 0 && (
        <div className="empty-state" style={{ marginTop: '4rem' }}>
          <FlaskConical size={48} />
          <h3>No tests yet</h3>
          <p>Add upcoming tests and exams to track them with a countdown.</p>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus size={15} /> Add test
          </button>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <p className="section-title">Upcoming</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {upcoming.map(t => (
              <TestCard
                key={t.id} test={t}
                onEdit={() => { setEditing(t); setFormOpen(true) }}
                onDelete={() => setDeleteTarget(t)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <p className="section-title">Past</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {past.map(t => (
              <TestCard
                key={t.id} test={t}
                onEdit={() => { setEditing(t); setFormOpen(true) }}
                onDelete={() => setDeleteTarget(t)}
                dimmed
              />
            ))}
          </div>
        </section>
      )}

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? 'Edit test' : 'Add test'} maxWidth="580px">
        <TestForm
          initial={editing} modules={modules}
          onSave={handleSave} onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} title="Delete test"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete" danger
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

interface TestCardProps {
  test: Test
  onEdit: () => void
  onDelete: () => void
  dimmed?: boolean
}

function TestCard({ test: t, onEdit, onDelete, dimmed }: TestCardProps) {
  const daysUntil = differenceInCalendarDays(parseISO(`${t.date}T${t.start_time}`), new Date())
  const isPastTest = daysUntil < 0

  return (
    <div className="card" style={{ opacity: dimmed ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {/* Left: countdown pill */}
        <div style={{
          flexShrink: 0, width: 64, height: 64,
          borderRadius: 'var(--radius-md)',
          background: isPastTest ? 'var(--color-bg-elevated)' : 'var(--color-accent-subtle)',
          border: `1px solid ${isPastTest ? 'var(--color-border)' : 'var(--color-accent)'}`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {isPastTest ? (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Done</span>
          ) : daysUntil === 0 ? (
            <>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-danger)', lineHeight: 1 }}>!</span>
              <span style={{ fontSize: 10, color: 'var(--color-danger)' }}>TODAY</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1.1 }}>{daysUntil}</span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>days</span>
            </>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            {t.module && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.module.colour }} />
                {t.module.name}
              </div>
            )}
            {t.weightage && (
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>· {t.weightage}%</span>
            )}
          </div>

          <h3 style={{ margin: '0 0 0.4rem', fontSize: 15, fontWeight: 700 }}>{t.name}</h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              {formatDate(t.date)} · {formatTime(t.start_time)}
              {t.end_time && ` – ${formatTime(t.end_time)}`}
            </span>
            {t.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> {t.location}
              </span>
            )}
          </div>

          {t.topics.length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {t.topics.map(topic => (
                <span key={topic} style={{
                  fontSize: 11, padding: '2px 8px',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--color-text-secondary)',
                }}>
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} title="Edit"><Pencil size={14} /></button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete} title="Delete">
            <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
