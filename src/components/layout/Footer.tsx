'use client'
import Link from 'next/link'
import { MapPin, Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--gray-900)',
      color: 'white',
      padding: '2.5rem 0',
      marginTop: 'auto',
    }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontFamily: 'var(--font-inter)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
            }}>🏙️</div>
            <span style={{ fontWeight: 700, fontSize: '1.25rem', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>CivicFix</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
            © 2026 CivicFix. Making cities better, one report at a time.
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <Link href="/explore" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', transition: '0.2s', fontWeight: 500 }}>Explore Map</Link>
            <Link href="/report" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', transition: '0.2s', fontWeight: 500 }}>Report Issue</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
