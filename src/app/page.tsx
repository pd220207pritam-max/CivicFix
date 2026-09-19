'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ArrowRight, MapPin, Zap, Shield, Image as ImageIcon, Sparkles, Phone, Mail } from 'lucide-react'

interface Stats {
  total: number
  resolved: number
  active: number
  thisWeek: number
}

const features = [
  {
    icon: <ImageIcon size={24} className="text-emerald-500" />,
    title: 'AI-Powered Reporting',
    desc: 'Just upload a photo and describe it briefly. Our AI instantly categorizes the issue for faster routing.',
    color: '#d1fae5',
    text: '#059669',
  },
  {
    icon: <MapPin size={24} className="text-blue-500" />,
    title: 'Precision Mapping',
    desc: 'Interactive maps automatically reverse-geocode your location so you don’t have to type long addresses.',
    color: '#dbeafe',
    text: '#0284c7',
  },
  {
    icon: <Zap size={24} className="text-amber-500" />,
    title: 'Real-time Tracking',
    desc: 'Follow your report’s journey from "Submitted" to "Resolved" with instant status notifications.',
    color: '#fef3c7',
    text: '#d97706',
  },
  {
    icon: <Shield size={24} className="text-purple-500" />,
    title: 'Smart Routing',
    desc: 'Issues are intelligently routed to the correct municipal departments for immediate action.',
    color: '#ede9fe',
    text: '#7c3aed',
  },
]

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  
  useEffect(() => {
    fetch('/api/stats').then(res => res.ok ? res.json() : null).then(setStats).catch(() => {})
  }, [])

  return (
    <div className="page-layout">
      <Navbar />
      
      <main className="main-content">
        {/* HERO SECTION */}
        <section style={{ 
          position: 'relative', 
          overflow: 'hidden',
          padding: '4rem 1.5rem 4rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Animated background blobs */}
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: 400, height: 400, background: 'var(--primary-100)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.6, zIndex: -1, animation: 'spin 20s linear infinite' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 350, height: 350, background: 'var(--accent-100)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.6, zIndex: -1, animation: 'spin 15s linear infinite reverse' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1.5rem', backdropFilter: 'blur(10px)', animation: 'slideDown 0.6s ease-out forwards', fontFamily: 'var(--font-inter)' }}>
            <Sparkles size={16} /> Empowering Citizens, Transforming Cities
          </div>
          
          <h1 className="animate-slide-down delay-100" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', maxWidth: 800, margin: '0 auto 1.5rem', letterSpacing: '-0.03em', opacity: 0 }}>
            Fix Your City, <br />
            <span style={{ 
              background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              padding: '0 4px'
            }}>One Report at a Time.</span>
          </h1>
          
          <p className="animate-slide-down delay-200" style={{ fontSize: '1.15rem', color: 'var(--gray-600)', maxWidth: 600, margin: '0 auto 2.5rem', opacity: 0, lineHeight: 1.6 }}>
            The AI-powered platform connecting citizens with local government to solve civic issues faster and more transparently than ever before.
          </p>
          
          <div className="animate-fade-in delay-300" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', opacity: 0 }}>
            <Link href="/report" className="btn btn-primary btn-lg">
              Report an Issue <ArrowRight size={18} />
            </Link>
            <Link href="/explore" className="btn btn-secondary btn-lg">
              Explore Map
            </Link>
          </div>
        </section>

        {/* STATS STRIP */}
        <section style={{ padding: '0 1.5rem', marginTop: '-3rem', position: 'relative', zIndex: 10 }}>
          <div className="container" style={{ maxWidth: 1000 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {[
                { label: 'Total Reports', value: stats?.total || '...', color: 'var(--accent)', bg: 'var(--accent-100)', icon: '📋' },
                { label: 'Issues Resolved', value: stats?.resolved || '...', color: 'var(--status-resolved)', bg: 'var(--status-resolved-bg)', icon: '✨' },
                { label: 'Active This Week', value: stats?.thisWeek || '...', color: 'var(--status-progress)', bg: 'var(--status-progress-bg)', icon: '🔥' },
              ].map((stat) => (
                <div key={stat.label} className="card card-hover" style={{ 
                  padding: '1.25rem 1rem', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  borderTop: `4px solid ${stat.color}`,
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', marginBottom: '0.75rem', color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading), sans-serif', color: stat.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: 8, fontWeight: 700, fontFamily: 'var(--font-inter), sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENTO GRID FEATURES */}
        <section style={{ padding: '3rem 1.5rem 4rem', background: 'var(--bg)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading), sans-serif', letterSpacing: '-0.02em', color: 'var(--gray-900)' }}>Next-generation reporting.</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--gray-500)', maxWidth: 600, margin: '0 auto', fontFamily: 'var(--font-inter), sans-serif' }}>Everything you need to make an impact in your neighborhood, powered by intelligent routing and real-time mapping.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {features.map((f, i) => (
                <div key={i} className="card card-hover" style={{ 
                  padding: '2rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%',
                  borderTop: `4px solid ${f.text}`,
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontFamily: 'var(--font-heading), sans-serif', color: 'var(--gray-900)' }}>{f.title}</h3>
                  <p style={{ color: 'var(--gray-600)', lineHeight: 1.6, flex: 1, fontFamily: 'var(--font-inter), sans-serif' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section style={{ padding: '2rem 1.5rem 6rem', position: 'relative', overflow: 'hidden' }}>
          <div className="container" style={{ position: 'relative', zIndex: 1 }}>
            <div className="card" style={{ 
              background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
              color: 'white', 
              padding: '2rem 2.5rem', 
              borderRadius: 'var(--radius-2xl)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-100)', marginBottom: '1rem' }}>
                <Sparkles size={14} /> Join the Movement
              </div>
              
              <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Ready to make a difference?</h2>
              
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <p style={{ color: 'var(--gray-300)', fontSize: '1rem', fontFamily: 'var(--font-inter)', lineHeight: 1.6, flex: '1 1 400px', margin: 0 }}>
                  Empower your community with CivicFix. Report local issues instantly and connect directly with municipal authorities. Track the progress of your complaints in real-time and join the movement to build cleaner, smarter cities today.
                </p>
                <img src="/smart_city.jpg" alt="Smart City" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '16px', border: '3px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} />
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '12px', border: '2px solid var(--primary-light)' }}>
                  <Phone size={18} style={{ color: 'var(--primary-light)' }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Helpline</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>1800-123-4567</div>
                  </div>
                </div>
                <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '12px', border: '2px solid var(--accent-light)' }}>
                  <Mail size={18} style={{ color: 'var(--accent-light)' }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Email Us</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>help@civicfix.com</div>
                  </div>
                </div>
                <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '12px', border: '2px solid #ec4899' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Instagram</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>@civicfix_official</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
