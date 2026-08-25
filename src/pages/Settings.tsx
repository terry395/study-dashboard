import { useState, useCallback, useEffect } from 'react'
import {
  User, Palette, Calendar, Tag, Database, LogOut, Download, Upload,
  Plus, Pencil, Trash2, Check,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  getCategories, createCategory, updateCategory, deleteCategory,
} from '@/services/calendar'
import type { CalendarCategory } from '@/types'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Alert } from '@/components/Alert'

type SettingsTab = 'profile' | 'appearance' | 'categories' | 'data' | 'account'

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile',    label: 'Profile',     icon: <User size={15} /> },
  { key: 'appearance', label: 'Appearance',  icon: <Palette size={15} /> },
  { key: 'categories', label: 'Categories',  icon: <Tag size={15} /> },
  { key: 'data',       label: 'Data',        icon: <Database size={15} /> },
  { key: 'account',    label: 'Account',     icon: <LogOut size={15} /> },
]

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>('profile')

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: '1.5rem' }}>
      {/* Sidebar tabs */}
      <div style={{
        width: 160, flexShrink: 0,
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.5rem',
        alignSelf: 'flex-start',
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: 'pointer', fontSize: 13,
              background: tab === t.key ? 'var(--color-accent-subtle)' : 'transparent',
              color: tab === t.key ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontWeight: tab === t.key ? 600 : 400,
              transition: 'all 0.15s',
              marginBottom: 2,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {tab === 'profile'    && <ProfileTab />}
        {tab === 'appearance' && <AppearanceTab />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'data'       && <DataTab />}
        {tab === 'account'    && <AccountTab />}
      </div>
    </div>
  )
}

// ── Profile ───────────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user } = useAuth()
  const [name,    setName]    = useState(user?.user_metadata?.name ?? '')
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)

  async function save() {
    setSaving(true)
    await supabase.auth.updateUser({ data: { name } })
    await supabase.from('profiles').upsert({ user_id: user!.id, name, email: user!.email! })
    setSaving(false); setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  return (
    <Section title="Profile">
      <div className="form-group">
        <label className="label">Display name</label>
        <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
      </div>
      <div className="form-group" style={{ marginTop: '0.75rem' }}>
        <label className="label">Email</label>
        <input className="input" type="email" value={user?.email ?? ''} disabled style={{ opacity: 0.6 }} />
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Email cannot be changed here.</p>
      </div>
      <button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginTop: '1rem' }}>
        {success ? <><Check size={14} /> Saved!</> : saving ? 'Saving…' : 'Save changes'}
      </button>
    </Section>
  )
}

// ── Appearance ────────────────────────────────────────────────────────────────

function AppearanceTab() {
  return (
    <Section title="Appearance">
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
        Toggle between <strong>Light</strong> and <strong>Dark</strong> mode using the ☀ / 🌙 button in the sidebar.
        Your preference is saved automatically and will persist after refreshing the page.
      </p>
      <div style={{
        marginTop: '1rem', padding: '1rem', background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
        fontSize: 13, color: 'var(--color-text-muted)',
      }}>
        <Calendar size={16} style={{ display: 'inline', marginRight: 6 }} />
        Calendar default view and week start settings coming soon.
      </div>
    </Section>
  )
}

// ── Categories ────────────────────────────────────────────────────────────────

const COLOURS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f59e0b','#22c55e','#14b8a6','#38bdf8','#f97316',
]

function CategoriesTab() {
  const [cats,        setCats]        = useState<CalendarCategory[]>([])
  const [formOpen,    setFormOpen]    = useState(false)
  const [editing,     setEditing]     = useState<CalendarCategory | null>(null)
  const [deleteTarget,setDeleteTarget]= useState<CalendarCategory | null>(null)
  const [catName,     setCatName]     = useState('')
  const [catColour,   setCatColour]   = useState(COLOURS[0])
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  const load = useCallback(async () => {
    const { data } = await getCategories()
    setCats(data)
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() { setEditing(null); setCatName(''); setCatColour(COLOURS[0]); setFormOpen(true) }
  function openEdit(c: CalendarCategory) { setEditing(c); setCatName(c.name); setCatColour(c.colour); setFormOpen(true) }

  async function handleSave() {
    if (!catName.trim()) { setError('Name is required.'); return }
    setError(''); setSaving(true)
    if (editing) {
      await updateCategory(editing.id, { name: catName.trim(), colour: catColour })
    } else {
      await createCategory({ name: catName.trim(), colour: catColour, icon: 'circle' })
    }
    setSaving(false); setFormOpen(false); await load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteCategory(deleteTarget.id)
    setDeleteTarget(null); await load()
  }

  return (
    <Section title="Event categories">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
        {cats.map(c => (
          <div key={c.id} className="card-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.colour, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.name}</span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)}><Pencil size={13} /></button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteTarget(c)}>
              <Trash2 size={13} style={{ color: 'var(--color-danger)' }} />
            </button>
          </div>
        ))}
      </div>
      <button className="btn btn-secondary" onClick={openCreate}><Plus size={14} /> Add category</button>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit category' : 'Add category'}>
        {error && <Alert type="error" message={error} />}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="label">
            Name <span className="required-star">*</span>
          </label>
          <input className="input" type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="Category name" />
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="label">Colour</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOURS.map(c => (
              <button key={c} type="button" onClick={() => setCatColour(c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                outline: catColour === c ? '3px solid var(--color-text-primary)' : '2px solid transparent',
                outlineOffset: 2,
              }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save' : 'Add'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete category"
        message={`Delete "${deleteTarget?.name}"? Existing events will lose this category.`}
        confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </Section>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

function DataTab() {
  const [exporting,  setExporting]  = useState(false)
  const [importing,  setImporting]  = useState(false)
  const [importMsg,  setImportMsg]  = useState('')
  const [importType, setImportType] = useState<'success'|'error'>('success')
  const [confirmOpen,setConfirmOpen]= useState(false)
  const [pendingData,setPendingData]= useState<Record<string, unknown> | null>(null)

  async function handleExport() {
    setExporting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setExporting(false); return }

    const [modules, assignments, tests, goals, sessions, cats, events] = await Promise.all([
      supabase.from('modules').select('*').eq('user_id', user.id),
      supabase.from('assignments').select('*').eq('user_id', user.id),
      supabase.from('tests').select('*').eq('user_id', user.id),
      supabase.from('study_goals').select('*').eq('user_id', user.id),
      supabase.from('study_sessions').select('*').eq('user_id', user.id),
      supabase.from('calendar_categories').select('*').eq('user_id', user.id),
      supabase.from('calendar_events').select('*').eq('user_id', user.id),
    ])

    const backup = {
      exportedAt: new Date().toISOString(),
      version: 1,
      data: {
        modules:            modules.data,
        assignments:        assignments.data,
        tests:              tests.data,
        study_goals:        goals.data,
        study_sessions:     sessions.data,
        calendar_categories:cats.data,
        calendar_events:    events.data,
      }
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `studydash-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!parsed.version || !parsed.data) throw new Error('Invalid backup file format.')
        setPendingData(parsed)
        setConfirmOpen(true)
      } catch (err) {
        setImportMsg(err instanceof Error ? err.message : 'Failed to parse file.')
        setImportType('error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleImport() {
    if (!pendingData) return
    setConfirmOpen(false); setImporting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setImporting(false); return }

    const d = pendingData.data as Record<string, unknown[]>

    // Simple import: upsert each table's records with current user_id
    const tables = ['modules','assignments','tests','study_goals','study_sessions','calendar_categories','calendar_events'] as const
    for (const table of tables) {
      const records = d[table] ?? []
      if (records.length === 0) continue
      const stamped = records.map((r: unknown) => ({ ...(r as object), user_id: user.id }))
      await supabase.from(table).upsert(stamped as never)
    }

    setImporting(false)
    setImportMsg('Import complete! Refresh the page to see your data.')
    setImportType('success')
    setPendingData(null)
  }

  return (
    <Section title="Data management">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Export */}
        <div className="card-sm">
          <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Export data
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 0.75rem' }}>
            Download all your data as a JSON backup file.
          </p>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
            <Download size={14} /> {exporting ? 'Exporting…' : 'Download backup'}
          </button>
        </div>

        {/* Import */}
        <div className="card-sm">
          <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Upload size={14} /> Import data
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 0.75rem' }}>
            Restore from a StudyDash backup file. Existing records with the same IDs will be overwritten.
          </p>
          {importMsg && <Alert type={importType} message={importMsg} dismissible />}
          <label className="btn btn-secondary" style={{ cursor: 'pointer', marginTop: 8 }}>
            <Upload size={14} /> {importing ? 'Importing…' : 'Select backup file'}
            <input type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Import data"
        message="This will overwrite any existing records with the same IDs. Are you sure you want to continue?"
        confirmLabel="Import"
        onConfirm={handleImport}
        onCancel={() => { setConfirmOpen(false); setPendingData(null) }}
      />
    </Section>
  )
}

// ── Account ───────────────────────────────────────────────────────────────────

function AccountTab() {
  const { user, signOut } = useAuth()
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  return (
    <Section title="Account">
      <div className="card-sm" style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Signed in as</div>
        <div style={{ fontWeight: 600, marginTop: 2 }}>{user?.email}</div>
      </div>

      <button className="btn btn-danger" onClick={() => setConfirmSignOut(true)}>
        <LogOut size={14} /> Sign out
      </button>

      <ConfirmDialog
        open={confirmSignOut} title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out" danger
        onConfirm={signOut} onCancel={() => setConfirmSignOut(false)}
      />
    </Section>
  )
}

// ── Helper ────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 style={{ margin: '0 0 1.25rem', fontSize: 16, fontWeight: 700 }}>{title}</h3>
      {children}
    </div>
  )
}
