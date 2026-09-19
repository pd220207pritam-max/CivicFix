'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useLoginTracker() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return

    // Check if we already logged this session
    const lastLogged = sessionStorage.getItem('cf_login_logged')
    if (lastLogged === session.user.email) return

    // Try to get location via browser geolocation
    const logActivity = async (locationData: Record<string, unknown> = {}) => {
      try {
        await fetch('/api/login-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(locationData),
        })
        sessionStorage.setItem('cf_login_logged', session?.user?.email || '')
      } catch (err) {
        console.error('Failed to log login activity', err)
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          // Reverse geocode using a free API
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
            )
            const geo = await res.json()
            await logActivity({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              city: geo.address?.city || geo.address?.town || geo.address?.village || null,
              region: geo.address?.state || null,
              country: geo.address?.country || null,
            })
          } catch {
            await logActivity({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          }
        },
        async () => {
          // Location denied — log without location
          await logActivity({})
        },
        { timeout: 5000 }
      )
    } else {
      logActivity({})
    }
  }, [status, session])
}
