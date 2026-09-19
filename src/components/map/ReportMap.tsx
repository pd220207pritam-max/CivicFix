'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Navigation } from 'lucide-react'

interface Location {
  lat: number
  lng: number
  address?: string
}

interface ReportMapProps {
  onLocationSelect: (location: Location) => void
  initialLocation?: Location
}

export default function ReportMap({ onLocationSelect, initialLocation }: ReportMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null)
  const [isLocating, setIsLocating] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  const onLocSelectRef = useRef(onLocationSelect)
  useEffect(() => {
    onLocSelectRef.current = onLocationSelect
  }, [onLocationSelect])

  const placeMarker = useCallback(async (lat: number, lng: number, panTo = false) => {
    if (!mapInstanceRef.current) return
    
    try {
      const L = (await import('leaflet')).default
      const map = mapInstanceRef.current
      if (!map) return

      if (panTo) {
        map.setView([lat, lng], 16)
      }

      if (markerRef.current) {
        markerRef.current.remove()
      }

      const iconHtml = `
        <div style="
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #1a6b3c, #22914f);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(26, 107, 60, 0.4);
          display: flex; align-items: center; justify-content: center;
        ">
          <span style="transform: rotate(45deg); font-size: 16px;">📍</span>
        </div>
      `

      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      })

      const marker = L.marker([lat, lng], { icon, draggable: true })
        .addTo(map)
        .bindPopup('<div style="font-size: 0.85rem; font-weight: 600;">📍 Issue location<br><span style="font-size: 0.75rem; color: #64748b; font-weight: 400;">Drag to adjust position</span></div>', { maxWidth: 200 })
        .openPopup()

      markerRef.current = marker

      // Initial location set without address
      const location: Location = { lat, lng }
      setSelectedLocation(location)
      onLocSelectRef.current(location)

      // Reverse geocode
      const fetchAddress = async (latitude: number, longitude: number) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'CivicFix/1.0' } }
          )
          if (res.ok) {
            const data = await res.json()
            const address = data.display_name?.split(', ').slice(0, 4).join(', ')
            if (address) {
              const updated = { lat: latitude, lng: longitude, address }
              setSelectedLocation(updated)
              onLocSelectRef.current(updated)
            }
          }
        } catch (e) {
          console.error('Geocoding failed', e)
        }
      }

      await fetchAddress(lat, lng)

      // Drag handler
      marker.on('dragend', async (e: any) => {
        const newLatLng = e.target.getLatLng()
        const newLat = newLatLng.lat
        const newLng = newLatLng.lng
        
        const newLoc: Location = { lat: newLat, lng: newLng }
        setSelectedLocation(newLoc)
        onLocSelectRef.current(newLoc)
        
        await fetchAddress(newLat, newLng)
      })

    } catch (err) {
      console.error('Error placing marker:', err)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return
    
    let isMounted = true

    async function initMap() {
      try {
        const leaflet = await import('leaflet')
        const L = leaflet.default

        // Fix default icon issue with webpack
        const DefaultIcon = L.Icon.Default as any
        delete DefaultIcon._getIconUrl
        DefaultIcon.prototype.options.iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
        DefaultIcon.prototype.options.shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
        DefaultIcon.prototype.options.iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png'

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        const startCenter: [number, number] = initialLocation
          ? [initialLocation.lat, initialLocation.lng]
          : [19.0760, 72.8777]

        const map = L.map(mapRef.current!, {
          center: startCenter,
          zoom: initialLocation ? 15 : 12,
          zoomControl: true,
        })

        mapInstanceRef.current = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        map.on('click', (e: any) => {
          if (isMounted) placeMarker(e.latlng.lat, e.latlng.lng, false)
        })

        if (initialLocation && isMounted) {
          placeMarker(initialLocation.lat, initialLocation.lng, false)
        }

        if (isMounted) {
          setMapReady(true)
        }
      } catch (err) {
        console.error('Report map init error:', err)
      }
    }

    initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [initialLocation, placeMarker])

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        placeMarker(lat, lng, true).finally(() => setIsLocating(false))
      },
      (error) => {
        setIsLocating(false)
        console.error('Geolocation error:', error)
        if (error.code === error.PERMISSION_DENIED) {
          alert('Location permission was denied. Please enable it in your browser settings or click on the map to select a location.')
        } else if (error.code === error.TIMEOUT) {
          alert('Location request timed out. Please click on the map to select a location.')
        } else {
          alert('Unable to detect your location. Please click on the map to select a location manually.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  return (
    <div>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      
      {/* Map instructions */}
      <div style={{
        background: 'var(--primary-50)', border: '1px solid var(--primary-200)',
        borderRadius: 'var(--radius-md)', padding: '10px 14px',
        fontSize: '0.85rem', color: 'var(--primary-dark)',
        marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8
      }}>
        <MapPin size={16} />
        Click anywhere on the map to place a marker, or use the button below to use your current location. Drag the marker to fine-tune.
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        style={{
          height: '380px', width: '100%',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          border: '2px solid var(--border)', cursor: 'crosshair',
        }}
      />

      {/* Location button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={isLocating || !mapReady}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {isLocating ? (
            <><div className="spinner" style={{ borderColor: 'var(--gray-400)', borderTopColor: 'var(--gray-700)', width: 14, height: 14 }} /> Detecting...</>
          ) : (
            <><Navigation size={14} /> Use My Current Location</>
          )}
        </button>

        {selectedLocation && (
          <div style={{
            background: 'var(--gray-50)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '6px 12px',
            fontSize: '0.8rem', color: 'var(--gray-700)'
          }}>
            <span style={{ fontWeight: 600 }}>Selected: </span>
            {selectedLocation.lat.toFixed(5)}°, {selectedLocation.lng.toFixed(5)}°
            {selectedLocation.address && (
              <span style={{ display: 'block', color: 'var(--gray-500)', fontSize: '0.75rem', marginTop: 2 }}>
                📍 {selectedLocation.address.slice(0, 60)}...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
