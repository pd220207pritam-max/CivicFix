'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { 
  MapPin, Bell, User, LogOut, ChevronDown, 
  Home, PlusCircle, Map, FileText, Settings, Shield
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  type: string
  createdAt: string
}

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
    }
  }, [session])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {}
  }

  async function markAllRead() {
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch {}
  }

  const user = session?.user as { name?: string; email?: string; role?: string; id?: string } | undefined

  const citizenLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/report', label: 'Report Issue', icon: PlusCircle },
    { href: '/explore', label: 'Explore Map', icon: Map },
    { href: '/dashboard', label: 'My Reports', icon: FileText },
  ]

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <div className="navbar-logo-icon">🏙️</div>
          CivicFix
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-nav" style={{ display: 'flex' }}>
          {citizenLinks.map(link => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {session?.user ? (
            <>
              {/* Notifications */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  className="notification-btn"
                  onClick={() => {
                    setShowNotifications(!showNotifications)
                    if (!showNotifications && unreadCount > 0) markAllRead()
                  }}
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="notification-badge" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 18, height: 18, fontSize: '0.65rem', fontWeight: 700,
                      top: 4, right: 4
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 12px)', right: -80,
                    background: 'linear-gradient(135deg, rgba(209, 250, 229, 0.95), rgba(224, 242, 254, 0.95))',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid rgba(255, 255, 255, 0.6)', boxShadow: '0 20px 40px -15px rgba(16,185,129,0.2)',
                    width: 340, overflow: 'hidden', zIndex: 200, backdropFilter: 'blur(16px)',
                    fontFamily: 'var(--font-inter), sans-serif'
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.4)' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-dark)' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: 'background 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--primary-dark)', fontSize: '0.95rem', fontWeight: 500 }}>
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} style={{ 
                            padding: '16px', 
                            borderBottom: '1px solid rgba(255, 255, 255, 0.4)', 
                            background: notif.isRead ? 'transparent' : 'rgba(255, 255, 255, 0.6)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                            e.currentTarget.style.transform = 'scale(1.02)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(255, 255, 255, 0.6)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                          >
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              {notif.title}
                              {!notif.isRead && <span style={{ width: 10, height: 10, background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--primary)' }} />}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--gray-700)', lineHeight: 1.5, marginBottom: '8px', fontWeight: 500 }}>{notif.message}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 700 }}>
                              {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div ref={userRef} style={{ position: 'relative' }}>
                <button
                  className="user-menu"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">{initials}</div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray-700)' }}>
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} style={{ color: 'var(--gray-500)' }} />
                </button>

                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'white', borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
                    minWidth: 200, overflow: 'hidden', zIndex: 200
                  }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{user?.email}</div>
                    </div>
                    <div style={{ padding: '0.5rem' }}>
                      {user?.role === 'ADMIN' && (
                        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, transition: 'background 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-100)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Shield size={16} /> Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: '#dc2626', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', width: '100%', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary btn-sm">Log in</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
