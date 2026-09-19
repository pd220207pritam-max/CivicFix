'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await signIn('credentials', {
        email, password, redirect: false
      })

      if (res?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(type: 'admin' | 'citizen') {
    if (type === 'admin') {
      setEmail('admin@civicfix.com')
      setPassword('admin123')
    } else {
      setEmail('citizen@civicfix.com')
      setPassword('citizen123')
    }
  }

  return (
    <div className="page-layout" style={{ background: 'linear-gradient(135deg, var(--primary-50), var(--accent-100), var(--primary-100))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 500, height: 500, background: 'var(--primary)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.15, zIndex: 0, animation: 'spin 20s linear infinite' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 500, height: 500, background: 'var(--accent)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.15, zIndex: 0, animation: 'spin 15s linear infinite reverse' }} />

      <div style={{ width: '100%', maxWidth: 440, zIndex: 1 }} className="animate-slide-down">
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '2rem', fontWeight: 500, transition: 'var(--transition)' }} className="hover:text-gray-900">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <div className="card" style={{ 
          padding: '3rem 2.5rem',
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', boxShadow: '0 12px 24px rgba(16, 185, 129, 0.4)' }}>🏙️</div>
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading), sans-serif', letterSpacing: '-0.02em', color: 'var(--gray-900)' }}>Welcome back</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '1rem', fontFamily: 'var(--font-inter), sans-serif' }}>Log in to your CivicFix account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <Link href="#" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Forgot password?</Link>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '1.5rem', justifyContent: 'center' }} disabled={loading}>
              {loading ? <><Loader size={18} className="animate-spin" /> Logging in...</> : 'Log in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--gray-600)', fontFamily: 'var(--font-inter), sans-serif' }}>
            Don't have an account? <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
