'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import AdminSidebar from '@/components/layout/AdminSidebar'

const ChartComponents = dynamic(() => import('@/components/admin/Charts'), { ssr: false })

interface Stats {
  total: number
  submitted: number
  underReview: number
  assigned: number
  inProgress: number
  resolved: number
  rejected: number
  thisWeek: number
  byCategory: Array<{ category: string; _count: { id: number } }>
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const user = session?.user as { role?: string } | undefined

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/dashboard')
  }, [status])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetch('/api/stats')
        .then(r => r.json())
        .then(setStats)
        .finally(() => setLoading(false))
    }
  }, [user?.role])

  const resolutionRate = stats && stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-topbar">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Analytics</h2>
        </div>

        <div className="admin-page-content">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)', margin: '0 auto' }} />
            </div>
          ) : stats && (
            <>
              {/* Key metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total Reports', value: stats.total, icon: '📋', color: '#dbeafe', text: '#2563eb' },
                  { label: 'Resolution Rate', value: `${resolutionRate}%`, icon: '✅', color: '#dcfce7', text: '#16a34a' },
                  { label: 'This Week', value: stats.thisWeek, icon: '📈', color: '#fef3c7', text: '#d97706' },
                  { label: 'Active Issues', value: stats.total - stats.resolved - stats.rejected, icon: '⚡', color: '#ede9fe', text: '#7c3aed' },
                ].map(m => (
                  <div key={m.label} className="stat-card">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '0.75rem' }}>{m.icon}</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: m.text, lineHeight: 1 }}>{m.value}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card">
                  <div className="card-body">
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Issues by Category</h3>
                    <ChartComponents type="category" data={stats.byCategory} />
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Issues by Status</h3>
                    <ChartComponents type="status" data={stats} />
                  </div>
                </div>
              </div>

              {/* Status breakdown table */}
              <div className="card">
                <div className="card-body">
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Status Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { label: 'Submitted', value: stats.submitted, color: '#6b7280', bg: '#f3f4f6' },
                      { label: 'Under Review', value: stats.underReview, color: '#d97706', bg: '#fef3c7' },
                      { label: 'Assigned', value: stats.assigned, color: '#2563eb', bg: '#dbeafe' },
                      { label: 'In Progress', value: stats.inProgress, color: '#7c3aed', bg: '#ede9fe' },
                      { label: 'Resolved', value: stats.resolved, color: '#16a34a', bg: '#dcfce7' },
                      { label: 'Rejected', value: stats.rejected, color: '#dc2626', bg: '#fee2e2' },
                    ].map(s => {
                      const pct = stats.total > 0 ? (s.value / stats.total) * 100 : 0
                      return (
                        <div key={s.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.875rem' }}>
                            <span style={{ fontWeight: 500 }}>{s.label}</span>
                            <span style={{ color: s.color, fontWeight: 700 }}>{s.value} ({Math.round(pct)}%)</span>
                          </div>
                          <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 99 }}>
                            <div style={{ height: '100%', background: s.color, borderRadius: 99, width: `${pct}%`, transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
