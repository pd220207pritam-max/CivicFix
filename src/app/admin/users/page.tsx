'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, MapPin, Monitor, Smartphone, Tablet, Globe, Clock, Shield, User, Mail, Phone, ChevronLeft } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  createdAt: string
  loginActivities: LoginActivity[]
}

interface LoginActivity {
  id: string
  ip: string | null
  city: string | null
  region: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  device: string | null
  browser: string | null
  loginAt: string
  user: UserData
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [activities, setActivities] = useState<LoginActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/login-activity')
      .then(r => r.json())
      .then(data => {
        setUsers(data.users || [])
        setActivities(data.activities || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const DeviceIcon = ({ device }: { device: string | null }) => {
    if (device === 'Mobile') return <Smartphone size={14} />
    if (device === 'Tablet') return <Tablet size={14} />
    return <Monitor size={14} />
  }

  const formatDate = (d: string) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  if (loading) {
    return (
      <div className="page-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page-layout" style={{ background: 'linear-gradient(135deg, #0f1117 0%, #1a1f2e 100%)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '6rem 1.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-400)', fontSize: '0.85rem', textDecoration: 'none' }}>
            <ChevronLeft size={16} /> Admin
          </Link>
          <span style={{ color: 'var(--gray-600)' }}>/</span>
          <span style={{ color: 'var(--gray-300)', fontSize: '0.85rem' }}>Users & Activity</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} color="white" />
          </div>
          <div>
            <h1 style={{ color: 'white', fontSize: '1.8rem', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', margin: 0 }}>User Management</h1>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', margin: 0 }}>{users.length} registered users — all login activity tracked</p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Users', value: users.length, color: '#8b5cf6', icon: <Users size={18} /> },
            { label: 'Citizens', value: users.filter(u => u.role === 'CITIZEN').length, color: '#10b981', icon: <User size={18} /> },
            { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, color: '#f59e0b', icon: <Shield size={18} /> },
            { label: 'Login Events', value: activities.length, color: '#06b6d4', icon: <Clock size={18} /> },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['users', 'activity'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
                background: activeTab === tab ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
                color: activeTab === tab ? 'white' : 'var(--gray-400)',
              }}
            >
              {tab === 'users' ? '👥 All Users' : '🕐 Login Activity'}
            </button>
          ))}
        </div>

        {/* USERS TABLE */}
        {activeTab === 'users' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {['User', 'Email', 'Phone', 'Role', 'Last Login', 'Last Location', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--gray-400)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const last = u.loginActivities?.[0]
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.role === 'ADMIN' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ color: 'white', fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-300)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={12} style={{ color: 'var(--gray-500)' }} />
                          {u.email}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-400)' }}>
                        {u.phone ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} />{u.phone}</div> : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: u.role === 'ADMIN' ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)', color: u.role === 'ADMIN' ? '#f59e0b' : '#a78bfa' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                        {last ? formatDate(last.loginAt) : <span style={{ color: 'var(--gray-600)' }}>Never</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-300)', fontSize: '0.8rem' }}>
                        {last?.city ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <MapPin size={12} style={{ color: '#10b981' }} />
                            {[last.city, last.region, last.country].filter(Boolean).join(', ')}
                          </div>
                        ) : <span style={{ color: 'var(--gray-600)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-500)', fontSize: '0.8rem' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ACTIVITY TABLE */}
        {activeTab === 'activity' && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {['User', 'Time', 'Location', 'Device', 'Browser', 'IP'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--gray-400)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>
                      No login activity recorded yet. Users who log in will appear here automatically.
                    </td>
                  </tr>
                ) : activities.map((a, i) => (
                  <tr key={a.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>
                          {a.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>{a.user?.name}</div>
                          <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>{a.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--gray-300)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} style={{ color: 'var(--gray-500)' }} />
                        {formatDate(a.loginAt)}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--gray-300)', fontSize: '0.8rem' }}>
                      {a.city ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={12} style={{ color: '#10b981' }} />
                          {[a.city, a.region, a.country].filter(Boolean).join(', ')}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Globe size={12} style={{ color: 'var(--gray-600)' }} />
                          <span style={{ color: 'var(--gray-600)' }}>Location not shared</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <DeviceIcon device={a.device} />
                        {a.device || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--gray-400)', fontSize: '0.8rem' }}>{a.browser || '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--gray-600)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{a.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
