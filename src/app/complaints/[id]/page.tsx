'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getCategoryInfo, getStatusInfo, formatDateTime, generateComplaintId } from '@/lib/utils'
import { ArrowLeft, MapPin, Calendar, Building2, CheckCircle } from 'lucide-react'

const DisplayMap = dynamic(() => import('@/components/map/DisplayMap'), { ssr: false, loading: () => (
  <div style={{ height: 300, background: 'var(--gray-100)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="spinner" style={{ borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)' }} />
  </div>
) })

const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved']

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
  updatedAt: string
  user: { id: string; name: string; email: string }
  department?: { id: string; name: string; color: string }
  statusHistory: Array<{
    id: string
    status: string
    note?: string
    createdAt: string
    changedBy: { name: string; role: string }
  }>
  adminNotes: Array<{
    id: string
    note: string
    createdAt: string
    author: { name: string }
  }>
}

export default function ComplaintDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const user = session?.user as { id?: string; role?: string } | undefined
  const isOwner = complaint?.user.id === user?.id
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    fetchComplaint()
  }, [params.id])

  async function fetchComplaint() {
    setLoading(true)
    try {
      const res = await fetch(`/api/complaints/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setComplaint(data.complaint)
      } else {
        setError('Complaint not found')
      }
    } catch {
      setError('Failed to load complaint')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-layout">
        <Navbar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)' }} />
        </main>
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <div className="page-layout">
        <Navbar />
        <main className="main-content">
          <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
            <h2>Complaint Not Found</h2>
            <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>{error}</p>
            <Link href="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          </div>
        </main>
      </div>
    )
  }

  const cat = getCategoryInfo(complaint.category)
  const stat = getStatusInfo(complaint.status)
  const complaintId = generateComplaintId(complaint.id)
  const currentStatusIndex = STATUSES.indexOf(complaint.status)

  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-content">
        <div className="container" style={{ padding: '2rem 1.5rem' }}>
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: '1.5rem', display: 'inline-flex' }}
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
            {/* Main content */}
            <div>
              {/* Header card */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                {complaint.imageUrl && (
                  <div style={{ height: 320, overflow: 'hidden' }}>
                    <img
                      src={complaint.imageUrl}
                      alt={complaint.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600 }}>#{complaintId}</span>
                        <span className="category-badge">{cat.icon} {complaint.category}</span>
                      </div>
                      <h1 style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>{complaint.title}</h1>
                    </div>
                    <span className={`badge badge-${
                      complaint.status === 'Under Review' ? 'review' :
                      complaint.status === 'In Progress' ? 'progress' :
                      complaint.status === 'Resolved' ? 'resolved' :
                      complaint.status === 'Rejected' ? 'rejected' :
                      complaint.status === 'Assigned' ? 'assigned' : 'submitted'
                    }`} style={{ fontSize: '0.85rem', padding: '6px 14px', flexShrink: 0 }}>
                      {complaint.status}
                    </span>
                  </div>

                  <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1.25rem' }}>{complaint.description}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={15} />
                      <span>{complaint.address || `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={15} />
                      <span>{formatDateTime(complaint.createdAt)}</span>
                    </div>
                    {complaint.department && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={15} />
                        <span style={{ color: complaint.department.color, fontWeight: 600 }}>{complaint.department.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>📍 Issue Location</h3>
                  <DisplayMap
                    complaints={[complaint]}
                    height={300}
                    center={[complaint.latitude, complaint.longitude]}
                    zoom={16}
                  />
                </div>
              </div>

              {/* Admin Notes */}
              {complaint.adminNotes.length > 0 && (
                <div className="card">
                  <div className="card-body">
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>💬 Official Updates</h3>
                    {complaint.adminNotes.map(note => (
                      <div key={note.id} style={{
                        padding: '1rem',
                        background: 'var(--primary-50)',
                        borderLeft: '3px solid var(--primary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '0.75rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)' }}>
                            {note.author.name}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                            {formatDateTime(note.createdAt)}
                          </span>
                        </div>
                        <p style={{ color: 'var(--gray-700)', fontSize: '0.9rem', lineHeight: 1.5 }}>{note.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div>
              {/* Status Progress */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>📊 Status Progress</h3>
                  
                  {/* Progress bar visualization */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Progress</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                        {complaint.status === 'Rejected' ? 'Rejected' : 
                         complaint.status === 'Resolved' ? '100%' :
                         `${Math.round((Math.max(0, currentStatusIndex) / (STATUSES.length - 1)) * 100)}%`}
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        background: complaint.status === 'Rejected' ? '#dc2626' : 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                        borderRadius: 99,
                        width: complaint.status === 'Rejected' ? '100%' : `${Math.max(10, (Math.max(0, currentStatusIndex) / (STATUSES.length - 1)) * 100)}%`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  {/* Steps */}
                  <div>
                    {STATUSES.map((s, i) => {
                      const isCompleted = currentStatusIndex > i || complaint.status === 'Resolved'
                      const isCurrent = s === complaint.status
                      const si = getStatusInfo(s)
                      return (
                        <div key={s} style={{ display: 'flex', gap: '0.75rem', marginBottom: i < STATUSES.length - 1 ? 0 : 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: isCompleted || isCurrent ? si.color : 'var(--gray-200)',
                              border: `2px solid ${isCompleted || isCurrent ? si.color : 'var(--gray-200)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: isCompleted || isCurrent ? 'white' : 'var(--gray-400)',
                              fontWeight: 700, fontSize: '0.75rem', zIndex: 1,
                            }}>
                              {isCompleted ? <CheckCircle size={14} /> : i + 1}
                            </div>
                            {i < STATUSES.length - 1 && (
                              <div style={{
                                width: 2, flex: 1, minHeight: 28,
                                background: isCompleted ? 'var(--primary)' : 'var(--gray-200)',
                                margin: '2px 0'
                              }} />
                            )}
                          </div>
                          <div style={{ paddingBottom: i < STATUSES.length - 1 ? '1rem' : 0, paddingTop: 3 }}>
                            <div style={{
                              fontWeight: isCurrent ? 700 : 500,
                              fontSize: '0.875rem',
                              color: isCurrent ? si.color : isCompleted ? 'var(--gray-700)' : 'var(--gray-400)',
                            }}>
                              {s}
                              {isCurrent && (
                                <span style={{
                                  marginLeft: 6, fontSize: '0.7rem', padding: '1px 6px',
                                  background: si.bg, color: si.color, borderRadius: 99, fontWeight: 600
                                }}>Current</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="card">
                <div className="card-body">
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>🕐 Activity Timeline</h3>
                  <div>
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
                            <div className="timeline-title">{hist.status}</div>
                            <div className="timeline-meta">
                              {formatDateTime(hist.createdAt)} · {hist.changedBy.name}
                            </div>
                            {hist.note && (
                              <div className="timeline-note">{hist.note}</div>
                            )}
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
      </main>
      <Footer />
    </div>
  )
}
