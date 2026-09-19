'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { getCategoryInfo, getStatusInfo, formatDateTime, generateComplaintId } from '@/lib/utils'
import { ArrowLeft, CheckCircle, MapPin, Calendar, Building2, Send } from 'lucide-react'

const DisplayMap = dynamic(() => import('@/components/map/DisplayMap'), { ssr: false, loading: () => <div style={{ height: 300, background: 'var(--gray-100)', borderRadius: 'var(--radius-xl)' }} /> })

const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected']

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
  user: { id: string; name: string; email: string; phone?: string }
  department?: { id: string; name: string; color: string }
  statusHistory: Array<{ id: string; status: string; note?: string; createdAt: string; changedBy: { name: string; role: string } }>
  adminNotes: Array<{ id: string; note: string; createdAt: string; author: { name: string } }>
}

export default function AdminComplaintDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])

  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const user = session?.user as { role?: string } | undefined

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/dashboard')
  }, [status])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      Promise.all([
        fetch(`/api/complaints/${params.id}`).then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
      ]).then(([complaintData, deptData]) => {
        setComplaint(complaintData.complaint)
        setDepartments(deptData.departments || [])
        if (complaintData.complaint) {
          setNewStatus(complaintData.complaint.status)
          setSelectedDept(complaintData.complaint.department?.id || '')
        }
      }).finally(() => setLoading(false))
    }
  }, [user?.role, params.id])

  async function handleUpdateStatus() {
    if (!newStatus) return
    setUpdating(true)
    setUpdateSuccess(false)
    try {
      const res = await fetch(`/api/complaints/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote,
          departmentId: selectedDept || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setComplaint(prev => prev ? { ...prev, status: newStatus, department: data.complaint.department, statusHistory: data.complaint.statusHistory } : prev)
        setStatusNote('')
        setUpdateSuccess(true)
        setTimeout(() => setUpdateSuccess(false), 3000)
      }
    } catch {}
    setUpdating(false)
  }

  async function handleAddNote() {
    if (!newNote.trim()) return
    setAddingNote(true)
    try {
      const res = await fetch(`/api/complaints/${params.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      })
      if (res.ok) {
        const data = await res.json()
        setComplaint(prev => prev ? { ...prev, adminNotes: [data.note, ...prev.adminNotes] } : prev)
        setNewNote('')
      }
    } catch {}
    setAddingNote(false)
  }

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)' }} />
        </div>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main">
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h2>Complaint not found</h2>
            <Link href="/admin/complaints" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Complaints</Link>
          </div>
        </div>
      </div>
    )
  }

  const cat = getCategoryInfo(complaint.category)
  const stat = getStatusInfo(complaint.status)

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/admin/complaints" className="btn btn-secondary btn-sm">
              <ArrowLeft size={14} /> Back
            </Link>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{complaint.title}</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontFamily: 'monospace', fontWeight: 700 }}>
                  #{generateComplaintId(complaint.id)}
                </span>
                <span className={`badge badge-${
                  complaint.status === 'Under Review' ? 'review' : complaint.status === 'In Progress' ? 'progress' :
                  complaint.status === 'Resolved' ? 'resolved' : complaint.status === 'Rejected' ? 'rejected' :
                  complaint.status === 'Assigned' ? 'assigned' : 'submitted'
                }`}>{complaint.status}</span>
              </div>
            </div>
          </div>
          <Link href={`/complaints/${complaint.id}`} target="_blank" className="btn btn-secondary btn-sm">
            View Public Page →
          </Link>
        </div>

        <div className="admin-page-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
            {/* Main */}
            <div>
              {/* Complaint info */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                {complaint.imageUrl && (
                  <div style={{ height: 280, overflow: 'hidden' }}>
                    <img src={complaint.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div className="card-body">
                  <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span className="category-badge">{cat.icon} {complaint.category}</span>
                    {complaint.department && (
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: complaint.department.color, background: `${complaint.department.color}15`, padding: '4px 10px', borderRadius: 99 }}>
                        {complaint.department.name}
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--gray-700)', lineHeight: 1.7, marginBottom: '1rem' }}>{complaint.description}</p>
                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><MapPin size={14} />{complaint.address || `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}</span>
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Calendar size={14} />{formatDateTime(complaint.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📍 Location</h3>
                  <DisplayMap
                    complaints={[complaint]}
                    height={300}
                    center={[complaint.latitude, complaint.longitude]}
                    zoom={15}
                  />
                </div>
              </div>

              {/* Reporter info */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>👤 Reported By</h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary), #2563eb)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: '1.1rem'
                    }}>
                      {complaint.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{complaint.user.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>{complaint.user.email}</div>
                      {complaint.user.phone && <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>{complaint.user.phone}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="card">
                <div className="card-body">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>💬 Admin Notes</h3>
                  <div style={{ marginBottom: '1rem' }}>
                    <textarea
                      className="form-textarea"
                      placeholder="Add an internal note or public update..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      rows={3}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '0.5rem' }}
                      onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}
                    >
                      <Send size={14} />
                      {addingNote ? 'Adding...' : 'Add Note'}
                    </button>
                  </div>
                  {complaint.adminNotes.map(note => (
                    <div key={note.id} style={{
                      padding: '0.875rem', background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-md)', marginBottom: '0.75rem',
                      borderLeft: '3px solid var(--primary)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)' }}>{note.author.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{formatDateTime(note.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.5 }}>{note.note}</p>
                    </div>
                  ))}
                  {complaint.adminNotes.length === 0 && (
                    <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No notes yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar actions */}
            <div>
              {/* Update status card */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🔄 Update Status</h3>

                  {updateSuccess && (
                    <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                      <CheckCircle size={16} /> Status updated successfully!
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assign Department</label>
                    <select
                      className="form-select"
                      value={selectedDept}
                      onChange={e => setSelectedDept(e.target.value)}
                    >
                      <option value="">— No Department —</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Update Note</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Add a note about this status change (shown to citizen)..."
                      value={statusNote}
                      onChange={e => setStatusNote(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={handleUpdateStatus}
                    disabled={updating || newStatus === complaint.status}
                  >
                    {updating ? <><div className="spinner" /> Updating...</> : '✓ Update Complaint'}
                  </button>
                </div>
              </div>

              {/* Status history */}
              <div className="card">
                <div className="card-body">
                  <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>🕐 Status History</h3>
                  {complaint.statusHistory.map((hist, i) => {
                    const si = getStatusInfo(hist.status)
                    return (
                      <div key={hist.id} className="timeline-item">
                        <div className="timeline-connector">
                          <div className="timeline-dot completed" style={{ background: si.color, borderColor: si.color }} />
                          {i < complaint.statusHistory.length - 1 && (
                            <div className="timeline-line completed" />
                          )}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-title" style={{ color: si.color }}>{hist.status}</div>
                          <div className="timeline-meta">{formatDateTime(hist.createdAt)}</div>
                          <div className="timeline-meta">{hist.changedBy.name}</div>
                          {hist.note && <div className="timeline-note" style={{ marginTop: 6 }}>{hist.note}</div>}
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
