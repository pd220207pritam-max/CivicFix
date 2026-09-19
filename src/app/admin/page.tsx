'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { getCategoryInfo, formatDate } from '@/lib/utils'
import { TrendingUp, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const ChartComponents = dynamic(() => import('@/components/admin/Charts'), { ssr: false })

interface Stats {
  total: number
  submitted: number
  underReview: number
  assigned: number
  inProgress: number
  resolved: number
  rejected: number
  active: number
  thisWeek: number
  byCategory: Array<{ category: string; _count: { id: number } }>
}

interface Complaint {
  id: string
  title: string
  category: string
  status: string
  createdAt: string
  address?: string
  user: { name: string }
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  const user = session?.user as { role?: string } | undefined

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/dashboard')
  }, [status, user?.role])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      Promise.all([
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/complaints?limit=5').then(r => r.json()),
      ]).then(([statsData, complaintsData]) => {
        setStats(statsData)
        setRecentComplaints(complaintsData.complaints || [])
      }).finally(() => setLoading(false))
    }
  }, [user?.role])

  if (status === 'loading' || loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Admin Dashboard</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: 2 }}>Overview of all civic complaints</p>
          </div>
          <Link href="/admin/complaints" className="btn btn-primary btn-sm">
            View All Complaints →
          </Link>
        </div>

        <div className="admin-page-content">
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total', value: stats?.total || 0, icon: <FileText size={20} />, bg: '#dbeafe', color: '#2563eb' },
              { label: 'New', value: stats?.submitted || 0, icon: <AlertCircle size={20} />, bg: '#fef3c7', color: '#d97706' },
              { label: 'In Progress', value: stats?.inProgress || 0, icon: <Clock size={20} />, bg: '#ede9fe', color: '#7c3aed' },
              { label: 'Resolved', value: stats?.resolved || 0, icon: <CheckCircle size={20} />, bg: '#dcfce7', color: '#16a34a' },
              { label: 'Rejected', value: stats?.rejected || 0, icon: <XCircle size={20} />, bg: '#fee2e2', color: '#dc2626' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: '0.75rem' }}>
                  {s.icon}
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* This week */}
          {stats && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--primary-50)', border: '1px solid var(--primary-200)',
                borderRadius: 'var(--radius-lg)', padding: '0.75rem 1.25rem'
              }}>
                <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                  {stats.thisWeek} new complaints this week
                </span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#dcfce7', border: '1px solid #86efac',
                borderRadius: 'var(--radius-lg)', padding: '0.75rem 1.25rem'
              }}>
                <CheckCircle size={18} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: 600 }}>
                  {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% resolution rate
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Charts */}
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Issues by Category</h3>
                {stats && <ChartComponents type="category" data={stats.byCategory} />}
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h3 style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Issues by Status</h3>
                {stats && <ChartComponents type="status" data={stats} />}
              </div>
            </div>
          </div>

          {/* Recent complaints */}
          <div className="card">
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem' }}>Recent Complaints</h3>
              <Link href="/admin/complaints" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Reported By</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map(c => {
                    const cat = getCategoryInfo(c.category)
                    return (
                      <tr key={c.id}>
                        <td style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-400)', fontFamily: 'monospace' }}>
                          CF{c.id.slice(-6).toUpperCase()}
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          <span style={{ fontWeight: 600, color: 'var(--gray-800)' }} className="truncate">{c.title}</span>
                        </td>
                        <td>
                          <span className="category-badge">{cat.icon} {c.category}</span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{c.user?.name}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{formatDate(c.createdAt)}</td>
                        <td>
                          <span className={`badge badge-${
                            c.status === 'Under Review' ? 'review' : c.status === 'In Progress' ? 'progress' :
                            c.status === 'Resolved' ? 'resolved' : c.status === 'Rejected' ? 'rejected' :
                            c.status === 'Assigned' ? 'assigned' : 'submitted'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <Link href={`/admin/complaints/${c.id}`} className="btn btn-secondary btn-sm">
                            Manage
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
