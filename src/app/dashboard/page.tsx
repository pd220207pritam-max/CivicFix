'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getCategoryInfo, getStatusInfo, formatDate, generateComplaintId, timeAgo } from '@/lib/utils'
import { PlusCircle, Search, Filter, ExternalLink, MapPin } from 'lucide-react'

interface Complaint {
  id: string
  title: string
  category: string
  status: string
  latitude: number
  longitude: number
  address?: string
  imageUrl?: string
  createdAt: string
  description: string
  department?: { name: string; color: string }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const user = session?.user as { name?: string; id?: string; role?: string } | undefined

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchComplaints()
    }
  }, [session, statusFilter, categoryFilter])

  async function fetchComplaints() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('userId', user?.id || '')
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

  const filtered = complaints.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Submitted').length,
    inProgress: complaints.filter(c => ['Under Review', 'Assigned', 'In Progress'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
  }

  if (status === 'loading') {
    return (
      <div className="page-layout">
        <Navbar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)' }} />
        </main>
      </div>
    )
  }

  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-content">
        <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: 1200 }}>
          {/* Header */}
          <div className="animate-slide-down" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
            <div>
              <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>My Reports</h1>
              <p style={{ fontSize: '1.05rem', color: 'var(--gray-500)' }}>Welcome back, {user?.name?.split(' ')[0]}! Track the status of your civic complaints.</p>
            </div>
            <Link href="/report" className="btn btn-primary" style={{ boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)' }}>
              <PlusCircle size={18} />
              New Report
            </Link>
          </div>

          {/* Premium Stats */}
          <div className="animate-fade-in delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              { label: 'Total Reports', value: stats.total, icon: '📋', color: 'var(--accent-100)', iconColor: 'var(--accent)', border: '#06b6d4' },
              { label: 'Pending', value: stats.pending, icon: '⏳', color: 'var(--status-review-bg)', iconColor: 'var(--status-review)', border: '#f59e0b' },
              { label: 'In Progress', value: stats.inProgress, icon: '🔧', color: 'var(--status-progress-bg)', iconColor: 'var(--status-progress)', border: '#8b5cf6' },
              { label: 'Resolved', value: stats.resolved, icon: '✅', color: 'var(--status-resolved-bg)', iconColor: 'var(--status-resolved)', border: '#10b981' },
            ].map(s => (
              <div key={s.label} className="card card-hover" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: `2px solid ${s.border}`, boxShadow: `0 4px 16px ${s.border}22` }}>
                <div style={{ width: 56, height: 56, borderRadius: '16px', background: s.color, color: s.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 600, marginTop: '0.25rem' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="animate-fade-in delay-200" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.5)', padding: '12px', borderRadius: 'var(--radius-xl)', backdropFilter: 'blur(10px)', border: '2px solid rgba(16,185,129,0.3)', boxShadow: '0 4px 16px rgba(16,185,129,0.08)' }}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 44, background: 'white', borderRadius: 'var(--radius-full)' }}
                placeholder="Search reports by title or location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 'auto', minWidth: 160, background: 'white', borderRadius: 'var(--radius-full)' }}
            >
              <option value="all">All Statuses</option>
              {['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ width: 'auto', minWidth: 180, background: 'white', borderRadius: 'var(--radius-full)' }}
            >
              <option value="all">All Categories</option>
              {['Pothole', 'Garbage', 'Broken Streetlight', 'Water Leakage', 'Drainage Problem', 'Damaged Road', 'Traffic Signal', 'Public Toilet', 'Illegal Dumping', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Complaints Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="card" style={{ height: 320 }}>
                  <div style={{ height: 160, background: 'var(--gray-100)', animation: 'pulse 2s infinite' }} />
                  <div className="card-body">
                    <div style={{ height: 20, background: 'var(--gray-100)', marginBottom: 12, borderRadius: 4, width: '80%' }} />
                    <div style={{ height: 16, background: 'var(--gray-100)', borderRadius: 4, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{complaints.length === 0 ? 'No reports yet' : 'No matching reports'}</h3>
              <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>{complaints.length === 0 ? 'You haven\'t submitted any civic complaints yet.' : 'Try adjusting your search or filters.'}</p>
              {complaints.length === 0 && (
                <Link href="/report" className="btn btn-primary">
                  <PlusCircle size={18} />
                  Report Your First Issue
                </Link>
              )}
            </div>
          ) : (
            <div className="animate-fade-in delay-300" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {filtered.map(complaint => {
                const cat = getCategoryInfo(complaint.category)
                const stat = getStatusInfo(complaint.status)
                return (
                  <Link href={`/complaints/${complaint.id}`} key={complaint.id} style={{ display: 'block' }}>
                    <div className="card card-hover" style={{ height: '100%', display: 'flex', flexDirection: 'column', border: '2px solid', borderColor: complaint.status === 'Resolved' ? '#10b981' : complaint.status === 'Rejected' ? '#ef4444' : complaint.status === 'In Progress' ? '#8b5cf6' : complaint.status === 'Assigned' ? '#06b6d4' : complaint.status === 'Under Review' ? '#f59e0b' : '#94a3b8', boxShadow: complaint.status === 'Resolved' ? '0 4px 16px #10b98122' : complaint.status === 'In Progress' ? '0 4px 16px #8b5cf622' : '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: 'var(--gray-100)' }}>
                        {complaint.imageUrl ? (
                          <img src={complaint.imageUrl} alt={complaint.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', opacity: 0.2 }}>
                            {cat.icon}
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--gray-700)', border: '1px solid rgba(255,255,255,0.5)' }}>
                          {generateComplaintId(complaint.id)}
                        </div>
                        <div style={{ position: 'absolute', top: 12, right: 12 }}>
                          <span className={`badge badge-${complaint.status === 'Under Review' ? 'review' : complaint.status === 'In Progress' ? 'progress' : complaint.status === 'Resolved' ? 'resolved' : complaint.status === 'Rejected' ? 'rejected' : complaint.status === 'Assigned' ? 'assigned' : 'submitted'}`} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            {complaint.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span className="category-badge" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                            {cat.icon} {complaint.category}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginLeft: 'auto' }}>
                            {timeAgo(complaint.createdAt)}
                          </span>
                        </div>
                        
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.4, color: 'var(--gray-900)' }}>
                          {complaint.title}
                        </h3>
                        
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: 'auto' }}>
                          <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {complaint.address || `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
