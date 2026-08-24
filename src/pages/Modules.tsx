import { useState, useEffect, useCallback } from 'react'
import { GraduationCap, Plus, Pencil, Trash2, Mail, User } from 'lucide-react'
import { getModules, createModule, updateModule, deleteModule } from '@/services/modules'
import type { Module } from '@/types'
import type { ModuleInsert } from '@/services/modules'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ModuleForm } from '@/components/ModuleForm'
import { PageLoader } from '@/components/LoadingSpinner'
import { Alert } from '@/components/Alert'

export default function ModulesPage() {
  const [modules,     setModules]     = useState<Module[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [formOpen,    setFormOpen]    = useState(false)
  const [editing,     setEditing]     = useState<Module | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Module | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getModules()
    setLoading(false)
    if (error) { setError('Failed to load modules.'); return }
    setModules(data)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(payload: ModuleInsert) {
    if (editing) {
      const { error } = await updateModule(editing.id, payload)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await createModule(payload)
      if (error) throw new Error(error.message)
    }
    setFormOpen(false)
    setEditing(null)
    await load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteModule(deleteTarget.id)
    setDeleteTarget(null)
    await load()
  }

  function openCreate() { setEditing(null); setFormOpen(true) }
  function openEdit(m: Module) { setEditing(m); setFormOpen(true) }

  if (loading) return <PageLoader />

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Modules</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
            Manage your school modules and lecturer information
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="add-module-btn">
          <Plus size={15} />
          Add module
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Empty state */}
      {modules.length === 0 && !loading && (
        <div className="empty-state" style={{ marginTop: '4rem' }}>
          <GraduationCap size={48} />
          <h3>No modules yet</h3>
          <p>Add your modules to start tracking assignments, tests and study goals.</p>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} /> Add your first module
          </button>
        </div>
      )}

      {/* Module grid */}
      {modules.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {modules.map(mod => (
            <ModuleCard
              key={mod.id}
              module={mod}
              onEdit={() => openEdit(mod)}
              onDelete={() => setDeleteTarget(mod)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? 'Edit module' : 'Add module'}
      >
        <ModuleForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete module"
        message={`Delete "${deleteTarget?.name}"? This will not delete associated assignments or tests, but will unlink them from this module.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

interface ModuleCardProps {
  module: Module
  onEdit: () => void
  onDelete: () => void
}

function ModuleCard({ module: mod, onEdit, onDelete }: ModuleCardProps) {
  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Colour accent bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 4,
        background: mod.colour,
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: mod.colour, flexShrink: 0,
            }} />
            {mod.code && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {mod.code}
              </span>
            )}
          </div>
          <h3 style={{ margin: '0.35rem 0 0', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {mod.name}
          </h3>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} title="Edit module" aria-label="Edit">
            <Pencil size={14} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete} title="Delete module" aria-label="Delete">
            <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
          </button>
        </div>
      </div>

      {/* Meta */}
      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(mod.academic_year || mod.semester) && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {[mod.academic_year, mod.semester].filter(Boolean).join(' · ')}
          </div>
        )}

        {mod.lecturer_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <User size={12} />
            <span>{mod.lecturer_name}</span>
          </div>
        )}

        {mod.lecturer_email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <Mail size={12} />
            <a href={`mailto:${mod.lecturer_email}`} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
              {mod.lecturer_email}
            </a>
          </div>
        )}

        {mod.description && (
          <p style={{
            margin: '0.25rem 0 0',
            fontSize: 12,
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {mod.description}
          </p>
        )}
      </div>
    </div>
  )
}
