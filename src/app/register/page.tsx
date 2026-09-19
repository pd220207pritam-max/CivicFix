'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CITIZEN',
  })
  const [countryCode, setCountryCode] = useState('+91')
  const [phoneNum, setPhoneNum] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        ...form,
        phone: `${countryCode} ${phoneNum}`
      }
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        router.push('/login?registered=true')
      } else {
        const data = await res.json()
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
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
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading), sans-serif', letterSpacing: '-0.02em', color: 'var(--gray-900)' }}>Create Account</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '1rem', fontFamily: 'var(--font-inter), sans-serif' }}>Join CivicFix to report issues in your city</p>
          </div>

          <form onSubmit={handleSubmit} style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">I want to register as a</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: 'CITIZEN' }))}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: form.role === 'CITIZEN' ? '2px solid var(--primary)' : '2px solid rgba(0,0,0,0.05)',
                    background: form.role === 'CITIZEN' ? 'rgba(16, 185, 129, 0.05)' : 'white',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    cursor: 'pointer', transition: 'var(--transition)'
                  }}
                >
                  <div style={{ fontSize: '1.5rem' }}>👤</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: form.role === 'CITIZEN' ? 'var(--primary)' : 'var(--gray-600)' }}>Citizen</div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: 'ADMIN' }))}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: form.role === 'ADMIN' ? '2px solid var(--accent)' : '2px solid rgba(0,0,0,0.05)',
                    background: form.role === 'ADMIN' ? 'rgba(14, 165, 233, 0.05)' : 'white',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    cursor: 'pointer', transition: 'var(--transition)'
                  }}
                >
                  <div style={{ fontSize: '1.5rem' }}>🛡️</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: form.role === 'ADMIN' ? 'var(--accent)' : 'var(--gray-600)' }}>Admin</div>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  className="form-select" 
                  style={{ width: '130px', flexShrink: 0 }}
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                >
                  <option value="+91">🇮🇳 +91 (India)</option>
                  <option value="+1">🇺🇸 +1 (US/CA)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+61">🇦🇺 +61 (AUS)</option>
                  <option value="+81">🇯🇵 +81 (Japan)</option>
                  <option value="+49">🇩🇪 +49 (Germany)</option>
                  <option value="+33">🇫🇷 +33 (France)</option>
                  <option value="+880">🇧🇩 +880 (BD)</option>
                  <option value="+92">🇵🇰 +92 (PK)</option>
                  <option value="+94">🇱🇰 +94 (SL)</option>
                  <option value="+977">🇳🇵 +977 (Nepal)</option>
                  <option value="+971">🇦🇪 +971 (UAE)</option>
                  <option value="+65">🇸🇬 +65 (SG)</option>
                  <option value="+60">🇲🇾 +60 (MY)</option>
                  <option value="+62">🇮🇩 +62 (ID)</option>
                  <option value="+55">🇧🇷 +55 (Brazil)</option>
                  <option value="+27">🇿🇦 +27 (SA)</option>
                </select>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="9876543210"
                  value={phoneNum}
                  onChange={e => setPhoneNum(e.target.value)}
                  style={{ flex: 1 }}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 6 }}>Must be at least 6 characters</div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '1.5rem', justifyContent: 'center' }} disabled={loading}>
              {loading ? <><Loader size={18} className="animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--gray-600)', fontFamily: 'var(--font-inter), sans-serif' }}>
            Already have an account? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
