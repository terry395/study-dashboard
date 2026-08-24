import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { Sidebar } from './Sidebar'

// Map paths to page titles
const PAGE_TITLES: Record<string, string> = {
  '/':            'Dashboard',
  '/calendar':    'Calendar',
  '/assignments': 'Assignments',
  '/tests':       'Tests',
  '/study':       'Study',
  '/modules':     'Modules',
  '/settings':    'Settings',
}

export function AppLayout() {
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const location = useLocation()

  // Find the best matching page title
  const pageTitle = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => location.pathname === path || location.pathname.startsWith(path + '/'))?.[1]
    ?? 'Dashboard'

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed(c => !c)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <div className="main-area">
        {/* Top bar */}
        <header className="topbar">
          {/* Mobile menu toggle */}
          <button
            className="btn btn-ghost btn-icon mobile-menu-btn"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, flex: 1 }}>{pageTitle}</h1>

          {/* Global search placeholder (Phase 7) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.35rem 0.75rem',
            cursor: 'text',
          }}>
            <Search size={13} style={{ color: 'var(--color-text-muted)' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Search… (⌘K)</span>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
