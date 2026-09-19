'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getCategoryInfo, getStatusInfo } from '@/lib/utils'
import { Suspense } from 'react'
import { Map, ListFilter, Activity, CheckCircle, Clock } from 'lucide-react'

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
}

function ExploreContent() {
  const searchParams = useSearchParams()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all')

  useEffect(() => {
    fetchComplaints()
  }, [statusFilter, categoryFilter])

  async function fetchComplaints() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '200')
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

  const stats = {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    submitted: complaints.filter(c => c.status === 'Submitted').length,
  }

  return (
    <div>
      <div style={{ position: 'relative', overflow: 'hidden', padding: '5rem 1.5rem 1.5rem', background: 'linear-gradient(to bottom, var(--primary-50), var(--bg))' }}>
        {/* Background blobs */}
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 400, height: 400, background: 'var(--accent-100)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.5, zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '0%', width: 300, height: 300, background: 'var(--primary-100)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.5, zIndex: 0 }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="animate-slide-down" style={{ marginTop: '2.5rem' }}>
            <h1 style={{ fontSize: '2.8rem', marginBottom: '0.5rem', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading), sans-serif', color: 'var(--gray-900)' }}>Explore Civic Issues</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', maxWidth: 850, lineHeight: 1.5, fontFamily: 'var(--font-inter), sans-serif' }}>
              View all reported civic issues in your community. Discover what's happening around you and track the progress of ongoing repairs.
            </p>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '1rem 1.5rem' }}>
        {/* Premium Stats bar */}
        <div className="animate-fade-in delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {[
            { label: 'Total Issues', value: stats.total, icon: <Activity size={18} />, color: 'var(--accent-100)', iconColor: 'var(--accent)' },
            { label: 'Resolved', value: stats.resolved, icon: <CheckCircle size={18} />, color: 'var(--status-resolved-bg)', iconColor: 'var(--status-resolved)' },
            { label: 'In Progress', value: stats.inProgress, icon: <Clock size={18} />, color: 'var(--status-progress-bg)', iconColor: 'var(--status-progress)' },
            { label: 'Awaiting Review', value: stats.submitted, icon: <Activity size={18} />, color: 'var(--status-review-bg)', iconColor: 'var(--status-review)' },
          ].map(s => (
            <div key={s.label} className="card card-hover" style={{ 
              padding: '0.75rem 1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              borderTop: `4px solid ${s.iconColor}`,
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: s.color, color: s.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading), sans-serif', lineHeight: 1, color: s.iconColor, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', fontWeight: 700, marginTop: '0.25rem', fontFamily: 'var(--font-inter), sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="animate-fade-in delay-200" style={{ 
          display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', 
          background: 'rgba(255,255,255,0.7)', padding: '6px 16px', borderRadius: 'var(--radius-xl)', 
          backdropFilter: 'blur(12px)', border: '2px solid rgba(16, 185, 129, 0.3)', 
          boxShadow: '0 8px 24px -10px rgba(16,185,129,0.3)', fontFamily: 'var(--font-inter), sans-serif' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gray-600)', fontWeight: 600, fontSize: '0.9rem', marginRight: 8 }}>
            <ListFilter size={18} /> Filters
          </div>
          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 160, background: 'white', borderRadius: 'var(--radius-full)' }}
          >
            <option value="all">All Statuses</option>
            {['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'].map(s => (
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
          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, background: 'var(--primary-50)', padding: '6px 16px', borderRadius: 999 }}>
            {loading ? <><div className="spinner" style={{ width: 12, height: 12, display: 'inline-block', marginRight: 6, borderColor: 'var(--primary-200)', borderTopColor: 'var(--primary)' }} /> Loading...</> : `${complaints.length} issues shown`}
          </div>
        </div>

        {/* Map */}
        <div className="animate-fade-in delay-300" style={{ height: 500, borderRadius: 'var(--radius-2xl)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', background: 'white' }}>
          {!loading && (
            <DisplayMap
              complaints={complaints}
              height={500}
              onMarkerClick={setSelectedComplaint}
            />
          )}
          {loading && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', flexDirection: 'column', gap: '1rem' }}>
              <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)' }} />
              <span style={{ color: 'var(--gray-500)' }}>Loading map data...</span>
            </div>
          )}
        </div>

        {/* Category legend */}
        <div className="animate-fade-in delay-300" style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.7)', border: '2px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', backdropFilter: 'blur(12px)', boxShadow: '0 8px 24px -10px rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category Legend</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {[
              { name: 'Pothole', icon: '🕳️', color: '#dc2626' },
              { name: 'Garbage', icon: '🗑️', color: '#16a34a' },
              { name: 'Broken Streetlight', icon: '💡', color: '#d97706' },
              { name: 'Water Leakage', icon: '💧', color: '#2563eb' },
              { name: 'Drainage Problem', icon: '🌊', color: '#0891b2' },
              { name: 'Damaged Road', icon: '🛣️', color: '#9f1239' },
              { name: 'Traffic Signal', icon: '🚦', color: '#7c3aed' },
              { name: 'Other', icon: '📋', color: '#4b5563' },
            ].map(cat => (
              <div key={cat.name} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'white', border: `1px solid rgba(0,0,0,0.05)`,
                padding: '6px 12px', borderRadius: 99, fontSize: '0.8rem',
                boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)'
              }} className="hover:shadow-md hover:-translate-y-0.5">
                <span>{cat.icon}</span>
                <span style={{ color: 'var(--gray-700)', fontWeight: 600 }}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-content" style={{ paddingTop: 0 }}>
        <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}>
          <ExploreContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
