'use client'
import { useEffect, useRef, useState } from 'react'
import { getCategoryInfo, getStatusInfo, generateComplaintId, formatDate } from '@/lib/utils'
import { MapPin, Navigation } from 'lucide-react'

interface Complaint {
  id: string
  title: string
  category: string
  status: string
  latitude: number
  longitude: number
  address?: string
  description: string
  createdAt: string
  imageUrl?: string
  user?: { name: string }
  department?: { name: string; color: string }
}

interface DisplayMapProps {
  complaints: Complaint[]
  height?: string | number
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (complaint: Complaint) => void
  showFilters?: boolean
}

// Haversine formula to calculate distance in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (R * c).toFixed(1) // Distance in km with 1 decimal
}

export default function DisplayMap({
  complaints,
  height = 500,
  center = [22.9074, 79.5880], // Central India
  zoom = 5,
  onMarkerClick,
  showFilters = false,
}: DisplayMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)
  const polylineRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isLocating, setIsLocating] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    async function initMap() {
      try {
        const leaflet = await import('leaflet')
        const L = leaflet.default
        leafletRef.current = L

        const DefaultIcon = L.Icon.Default as any
        delete DefaultIcon._getIconUrl
        DefaultIcon.prototype.options.iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
        DefaultIcon.prototype.options.shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
        DefaultIcon.prototype.options.iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png'

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
        }

        const map = L.map(mapRef.current!, {
          center: center,
          zoom,
          zoomControl: true,
        })
        mapInstanceRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        renderMarkers(L, map)
      } catch (err) {
        console.error('Map initialization error:', err)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [complaints, center, zoom]) // Only re-run if core props change

  // Function to re-render markers when filters or userLocation changes, without destroying map
  const renderMarkers = (L = leafletRef.current, map = mapInstanceRef.current) => {
    if (!L || !map) return

    // Clear existing
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    const filtered = complaints.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
      return true
    })

    filtered.forEach(complaint => {
      const catInfo = getCategoryInfo(complaint.category)
      const statusInfo = getStatusInfo(complaint.status)

      const iconHtml = `
        <div style="
          width: 36px; height: 36px;
          background: ${catInfo.color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        ">
          <span style="transform: rotate(45deg); font-size: 14px; line-height: 1;">${catInfo.icon}</span>
        </div>
      `
      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      const marker = L.marker([complaint.latitude, complaint.longitude], { icon }).addTo(map)
      
      // Calculate distance if user location is known
      let distanceInfoHtml = ''
      if (userLocation) {
        const distKm = parseFloat(getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, complaint.latitude, complaint.longitude))
        const drivingTime = Math.max(1, Math.round((distKm / 30) * 60)) // ~30 km/h avg city speed
        distanceInfoHtml = `
          <div style="margin-top: 12px; display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; background: #f8fafc; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 6px; color: #0369a1; font-weight: 700;">
              <span style="font-size: 14px;">📍</span> ${distKm} km
            </div>
            <div style="display: flex; align-items: center; gap: 6px; color: #475569; font-weight: 600;">
              <span style="font-size: 14px;">🚗</span> ~${drivingTime} min
            </div>
          </div>
        `
      }

      marker.bindPopup(`
        <div style="min-width: 240px; font-family: var(--font-inter), sans-serif; padding-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
            <span style="font-size: 18px;">${catInfo.icon}</span>
            <span style="font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; background: ${statusInfo.bg}; color: ${statusInfo.color};">${complaint.status}</span>
          </div>
          <h4 style="margin: 0 0 6px; font-size: 0.95rem; font-weight: 700; color: #0f172a; line-height: 1.3;">${complaint.title}</h4>
          <p style="margin: 0 0 6px; font-size: 0.78rem; color: #64748b;">${catInfo.name} • ${formatDate(complaint.createdAt)}</p>
          ${complaint.address ? `<p style="margin: 0 0 10px; font-size: 0.78rem; color: #94a3b8;">📍 ${complaint.address}</p>` : ''}
          <a href="/complaints/${complaint.id}" style="display: block; text-align: center; padding: 8px 14px; background: var(--primary); color: white; border-radius: 6px; font-size: 0.8rem; font-weight: 600; text-decoration: none;">View Details</a>
          ${distanceInfoHtml}
        </div>
      `, { maxWidth: 280, autoPanPadding: [50, 50] })

      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(complaint)

        // Draw line if user location is available
        if (userLocation && map && L) {
          if (polylineRef.current) polylineRef.current.remove()
          
          polylineRef.current = L.polyline(
            [
              [userLocation.lat, userLocation.lng],
              [complaint.latitude, complaint.longitude]
            ], 
            { color: '#0ea5e9', weight: 3, dashArray: '8, 8', opacity: 0.8 }
          ).addTo(map)
          
          // Fit bounds to show both user and complaint if they are far apart
          map.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50], maxZoom: 16 })
        }
      })

      markersRef.current.push(marker)
    })
  }

  // Update markers when filters or userLocation change
  useEffect(() => {
    if (leafletRef.current && mapInstanceRef.current) {
      renderMarkers()
    }
  }, [statusFilter, categoryFilter, userLocation])

  const findMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setUserLocation({ lat, lng })
        
        const L = leafletRef.current
        const map = mapInstanceRef.current
        if (L && map) {
          if (userMarkerRef.current) userMarkerRef.current.remove()
          
          const icon = L.divIcon({
            html: `<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
            className: '',
            iconSize: [20, 20]
          })
          
          userMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map)
            .bindPopup('<div style="font-weight: 600; font-family: var(--font-inter);">📍 You are here</div>')
            .openPopup()
            
          map.setView([lat, lng], 14)
        }
        setIsLocating(false)
      },
      (err) => {
        console.error(err)
        alert("Unable to retrieve your location.")
        setIsLocating(false)
      }
    )
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {showFilters && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
            <option value="all">All Statuses</option>
            {['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: 'auto', minWidth: 180 }}>
            <option value="all">All Categories</option>
            {['Pothole', 'Garbage', 'Broken Streetlight', 'Water Leakage', 'Drainage Problem', 'Damaged Road', 'Traffic Signal', 'Public Toilet', 'Illegal Dumping', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}
      
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      
      <div
        ref={mapRef}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          width: '100%',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      />

      {/* Floating Locate Me Button */}
      <button 
        onClick={findMyLocation}
        disabled={isLocating}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: isLocating ? 'wait' : 'pointer',
          color: userLocation ? '#3b82f6' : 'var(--gray-600)',
          transition: '0.2s',
        }}
        title="Find My Location"
      >
        {isLocating ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <Navigation size={22} fill={userLocation ? "#3b82f6" : "none"} />}
      </button>
    </div>
  )
}
