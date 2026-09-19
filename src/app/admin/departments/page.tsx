'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/layout/AdminSidebar'

interface Department {
  id: string
  name: string
  description?: string
  color: string
  _count: { complaints: number }
}

export default function AdminDepartmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  const user = session?.user as { role?: string } | undefined

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/dashboard')
  }, [status])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetch('/api/departments')
        .then(r => r.json())
        .then(d => setDepartments(d.departments || []))
        .finally(() => setLoading(false))
    }
  }, [user?.role])

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-topbar">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Departments</h2>
        </div>

        <div className="admin-page-content">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)', margin: '0 auto' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {departments.map(dept => (
                <Link key={dept.id} href={`/admin/complaints?department=${dept.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div className="card card-hover" style={{ height: '100%', border: `2px solid ${dept.color}30` }}>
                    <div className="card-body">
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: `${dept.color}20`, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', marginBottom: '1rem'
                      }}>🏛️</div>
                      <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>{dept.name}</h3>
                      {dept.description && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1rem', lineHeight: 1.5 }}>{dept.description}</p>
                      )}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingTop: '0.75rem', borderTop: '1px solid var(--border)', marginTop: 'auto'
                      }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>Assigned complaints</span>
                        <span style={{
                          fontFamily: 'var(--font-heading)', fontSize: '1.25rem',
                          fontWeight: 700, color: dept.color
                        }}>{dept._count.complaints}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
