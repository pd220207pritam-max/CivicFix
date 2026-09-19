'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { getCategoryInfo, getStatusInfo, formatDate, generateComplaintId } from '@/lib/utils'
import { Search, Trash2, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

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
  user: { name: string; email: string }
  department?: { name: string; color: string }
}

function AdminComplaintsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department') || 'all')
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const user = session?.user as { role?: string } | undefined

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/dashboard')
  }, [status, user?.role])

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(d => setDepartments(d.departments || []))
  }, [])

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchComplaints()
  }, [user?.role, statusFilter, categoryFilter, departmentFilter, page])

  async function fetchComplaints() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '15')
      params.set('page', String(page))
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (departmentFilter !== 'all') params.set('department', departmentFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/complaints?${params}`)
      if (res.ok) {
        const data = await res.json()
        setComplaints(data.complaints || [])
        setTotal(data.total || 0)
        setTotalPages(data.pages || 1)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchComplaints()
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this complaint? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/complaints/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setComplaints(prev => prev.filter(c => c.id !== id))
        setTotal(prev => prev - 1)
      }
    } catch {}
    setDeleteId(null)
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>All Complaints</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: 2 }}>{total} total complaints</p>
          </div>
          <button onClick={() => fetchComplaints()} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        <div className="admin-page-content">
          {/* Filters */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <form onSubmit={handleSearch} style={{ flex: '1 1 240px', position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="Search by title, description, address..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </form>
                <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: 160 }}>
                  <option value="all">All Statuses</option>
                  {['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select className="form-select" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: 180 }}>
                  <option value="all">All Categories</option>
                  {['Pothole', 'Garbage', 'Broken Streetlight', 'Water Leakage', 'Drainage Problem', 'Damaged Road', 'Traffic Signal', 'Public Toilet', 'Illegal Dumping', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select className="form-select" value={departmentFilter} onChange={e => { setDepartmentFilter(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: 200 }}>
                  <option value="all">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="table-container">
              {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                  <div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)', margin: '0 auto' }} />
                </div>
              ) : complaints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No complaints found</h3>
                  <p>Try adjusting your filters</p>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Photo</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Citizen</th>
                      <th>Date</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map(c => {
                      const cat = getCategoryInfo(c.category)
                      const stat = getStatusInfo(c.status)
                      return (
                        <tr key={c.id}>
                          <td style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-400)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            CF{c.id.slice(-6).toUpperCase()}
                          </td>
                          <td>
                            <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--gray-100)', flexShrink: 0 }}>
                              {c.imageUrl ? (
                                <img src={c.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{cat.icon}</div>
                              )}
                            </div>
                          </td>
                          <td style={{ maxWidth: 200 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-800)' }}>{c.title}</span>
                            {c.address && <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2 }}>📍 {c.address.slice(0, 40)}...</div>}
                          </td>
                          <td><span className="category-badge">{cat.icon} {c.category}</span></td>
                          <td>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.user?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{c.user?.email}</div>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{formatDate(c.createdAt)}</td>
                          <td>
                            {c.department ? (
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: c.department.color, background: `${c.department.color}15`, padding: '3px 8px', borderRadius: 99 }}>
                                {c.department.name}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>Unassigned</span>
                            )}
                          </td>
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
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Link href={`/admin/complaints/${c.id}`} className="btn btn-secondary btn-sm" style={{ gap: 4 }}>
                                <Eye size={13} /> Manage
                              </Link>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="btn btn-danger btn-sm btn-icon"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                  Page {page} of {totalPages} ({total} total)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminComplaintsPage() {
  return (
    <Suspense fallback={
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)' }} />
        </div>
      </div>
    }>
      <AdminComplaintsContent />
    </Suspense>
  )
}
