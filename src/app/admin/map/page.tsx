'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { getCategoryInfo, getStatusInfo } from '@/lib/utils'

const DisplayMap = dynamic(() => import('@/components/map/DisplayMap'), { ssr: false, loading: () => (
  <div style={{ height: '100%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)' }} />
  </div>
) })

interface Complaint {
  id: string
  title: string
  description: string
  category: string
  status: string
  latitude: number
  longitude: number
  address?: string
  imageUrl?: string
  createdAt: string
  user?: { name: string }
  department?: { name: string; color: string }
}

export default function AdminMapPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selected, setSelected] = useState<Complaint | null>(null)

  const user = session?.user as { role?: string } | undefined

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/dashboard')
  }, [status])

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchComplaints()
  }, [user?.role, statusFilter, categoryFilter])

  async function fetchComplaints() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '500')
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const res = await fetch(`/api/complaints?${params}`)
      if (res.ok) {
        const data = await res.json()
        setComplaints(data.complaints || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const catCounts = complaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Issue Map</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: 2 }}>
              {complaints.length} issues shown
            </p>
          </div>
        </div>

        <div className="admin-page-content">
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
              <option value="all">All Statuses</option>
              {['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: 'auto', minWidth: 180 }}>
              <option value="all">All Categories</option>
              {['Pothole', 'Garbage', 'Broken Streetlight', 'Water Leakage', 'Drainage Problem', 'Damaged Road', 'Traffic Signal', 'Public Toilet', 'Illegal Dumping', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
            {/* Map */}
            <div>
              <div style={{ height: 'calc(100vh - 220px)', minHeight: 500, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                {!loading && (
                  <DisplayMap
                    complaints={complaints}
                    height="100%"
                    zoom={11}
                    onMarkerClick={setSelected}
                  />
                )}
                {loading && (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', flexDirection: 'column', gap: '1rem' }}>
                    <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)' }} />
                    <span style={{ color: 'var(--gray-500)' }}>Loading complaints...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Selected complaint */}
              {selected ? (
                <div className="card">
                  <div className="card-body">
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: '1rem' }}>{selected.title}</h3>
                        <button
                          onClick={() => setSelected(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 4 }}
                        >✕</button>
                      </div>
                    </div>
                    {selected.imageUrl && (
                      <img src={selected.imageUrl} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: '0.75rem' }} />
                    )}
                    <div style={{ display: 'flex', gap: 6, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <span className="category-badge">{getCategoryInfo(selected.category).icon} {selected.category}</span>
                      <span className={`badge badge-${
                        selected.status === 'Under Review' ? 'review' : selected.status === 'In Progress' ? 'progress' :
                        selected.status === 'Resolved' ? 'resolved' : selected.status === 'Rejected' ? 'rejected' :
                        selected.status === 'Assigned' ? 'assigned' : 'submitted'
                      }`}>{selected.status}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                      {selected.description.slice(0, 120)}...
                    </p>
                    {selected.address && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '0.75rem' }}>📍 {selected.address}</p>
                    )}
                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '1rem' }}>
                      By: {selected.user?.name}
                    </p>
                    <Link
                      href={`/admin/complaints/${selected.id}`}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Manage Complaint →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📍</div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Click a marker</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>Select a complaint on the map to view details</p>
                  </div>
                </div>
              )}

              {/* Category breakdown */}
              <div className="card">
                <div className="card-body">
                  <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem' }}>Category Breakdown</h3>
                  {Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                    const catInfo = getCategoryInfo(cat)
                    const pct = complaints.length > 0 ? (count / complaints.length) * 100 : 0
                    return (
                      <div key={cat} style={{ marginBottom: '0.625rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                          <span>{catInfo.icon} {cat}</span>
                          <span style={{ fontWeight: 600 }}>{count}</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 99 }}>
                          <div style={{ height: '100%', background: catInfo.color, borderRadius: 99, width: `${pct}%`, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
