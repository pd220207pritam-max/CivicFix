'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { 
  LayoutDashboard, FileText, Map, Building2, 
  BarChart3, LogOut, ChevronRight, Users
} from 'lucide-react'

const adminLinks = [
  {
    section: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/complaints', label: 'Complaints', icon: FileText },
      { href: '/admin/map', label: 'Issue Map', icon: Map },
    ]
  },
  {
    section: 'Management',
    items: [
      { href: '/admin/users', label: 'Users & Activity', icon: Users },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ]
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as { name?: string; email?: string } | undefined

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A'

  return (
    <aside className="admin-sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem', padding: '0 8px' }}>
        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>🏙️</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.03em' }}>
          CivicFix<span style={{ color: 'var(--primary)', marginLeft: 4 }}>Admin</span>
        </div>
      </div>

      <nav className="admin-nav" style={{ flex: 1, overflowY: 'auto' }}>
        {adminLinks.map(group => (
          <div key={group.section} style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', padding: '0 12px' }}>
              {group.section}
            </div>
            {group.items.map(link => {
              const Icon = link.icon
              const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`admin-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              )
            })}
          </div>
        ))}
        
        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', padding: '0 12px' }}>
            Account
          </div>
          <Link href="/" className="admin-nav-link">
            <ChevronRight size={18} />
            Citizen View
          </Link>
        </div>
      </nav>

      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem', padding: '0 8px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gray-800), var(--gray-900))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '0.85rem'
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-900)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Administrator</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
            padding: '10px 12px', borderRadius: 'var(--radius-lg)',
            background: 'var(--status-rejected-bg)', color: 'var(--status-rejected)',
            border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
            transition: 'var(--transition-bounce)'
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
