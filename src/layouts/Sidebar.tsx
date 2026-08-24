import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  FlaskConical,
  BookOpen,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { NavItem } from '@/types'

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   path: '/',            icon: LayoutDashboard },
  { label: 'Calendar',    path: '/calendar',    icon: Calendar },
  { label: 'Assignments', path: '/assignments', icon: ClipboardList },
  { label: 'Tests',       path: '/tests',       icon: FlaskConical },
  { label: 'Study',       path: '/study',       icon: BookOpen },
  { label: 'Modules',     path: '/modules',     icon: GraduationCap },
  { label: 'Settings',    path: '/settings',    icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapse: () => void
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const { user, signOut } = useAuth()

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Logo / branding */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '1rem',
        height: 56,
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--color-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 16,
          fontWeight: 700,
          color: '#fff',
        }}>
          S
        </div>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
            StudyDash
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem 0', overflow: 'hidden auto' }}>
        {NAV_ITEMS.map(item => (
          <SidebarNavItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            onClick={onCloseMobile}
          />
        ))}
      </nav>

      {/* User / footer */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flexShrink: 0,
      }}>
        {/* User info */}
        {!collapsed && user && (
          <div style={{
            padding: '0.5rem 0.25rem',
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>Signed in as</div>
            <div style={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user.email}
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          className="btn btn-ghost"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', gap: 10, padding: '0.5rem 0.5rem' }}
          onClick={signOut}
          title="Sign out"
        >
          <LogOut size={16} />
          {!collapsed && <span style={{ fontSize: 13 }}>Sign out</span>}
        </button>

        {/* Collapse toggle (desktop only) */}
        <button
          className="btn btn-ghost"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', gap: 10, padding: '0.5rem 0.5rem' }}
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span style={{ fontSize: 13 }}>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

interface NavItemProps {
  item: NavItem
  collapsed: boolean
  onClick: () => void
}

function SidebarNavItem({ item, collapsed, onClick }: NavItemProps) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onClick}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0.5rem 0.75rem',
        margin: '1px 0.5rem',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 500,
        transition: 'background 0.15s, color 0.15s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        background: isActive ? 'var(--color-accent-subtle)' : 'transparent',
        justifyContent: collapsed ? 'center' : 'flex-start',
      })}
      title={collapsed ? item.label : undefined}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}
