'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { CATEGORIES, getCategoryInfo } from '@/lib/utils'
import { Upload, X, Loader, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react'

const ReportMap = dynamic(() => import('@/components/map/ReportMap'), { ssr: false, loading: () => (
  <div style={{ height: 380, background: 'var(--gray-100)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', color: 'var(--gray-400)' }}><div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)', margin: '0 auto 8px' }} />Loading map...</div>
  </div>
) })

interface Location {
  lat: number
  lng: number
  address?: string
}

interface DuplicateInfo {
  id: string
  title: string
  status: string
  createdAt: string
}

export default function ReportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
  })
  const [location, setLocation] = useState<Location | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState('')

  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAccepted, setAiAccepted] = useState(false)

  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null)
  const [skipDuplicate, setSkipDuplicate] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // AI suggestion when image is uploaded or description typed
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((imageUrl || form.description.length > 20) && !form.category) {
        getAiSuggestion()
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [imageUrl, form.description])

  async function getAiSuggestion() {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, description: form.description }),
      })
      const data = await res.json()
      if (data.category) {
        setAiSuggestion(data.category)
      }
    } catch {}
    setAiLoading(false)
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError('')
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setImageError('Only JPG, PNG, and WEBP images are allowed')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image must be less than 10MB')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))

    // Auto upload
    setUploadingImage(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setImageUrl(data.url)
      } else {
        const err = await res.json()
        setImageError(err.error || 'Upload failed')
        setImagePreview(null)
        setImageFile(null)
      }
    } catch {
      setImageError('Upload failed. Please try again.')
    }
    setUploadingImage(false)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    setImageUrl(null)
    setImageError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function acceptAiSuggestion() {
    if (aiSuggestion) {
      setForm(f => ({ ...f, category: aiSuggestion }))
      setAiAccepted(true)
    }
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Issue title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.category) e.category = 'Please select a category'
    if (!location) e.location = 'Please select a location on the map'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setSubmitError('')
    setDuplicate(null)

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          latitude: location!.lat,
          longitude: location!.lng,
          address: location!.address,
          imageUrl: imageUrl,
          checkDuplicate: !skipDuplicate,
        }),
      })

      const data = await res.json()

      if (data.duplicate && !skipDuplicate) {
        setDuplicate(data.existing)
        setSubmitting(false)
        return
      }

      if (!res.ok) {
        setSubmitError(data.error || 'Submission failed')
        setSubmitting(false)
        return
      }

      setSubmitted(true)
      setTimeout(() => {
        router.push(`/complaints/${data.complaint.id}`)
      }, 2000)
    } catch {
      setSubmitError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="page-layout">
        <Navbar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Complaint Submitted!</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '1.05rem' }}>
              Your complaint has been received. Redirecting to details...
            </p>
            <div className="spinner" style={{ margin: '1.5rem auto 0', width: 32, height: 32, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)' }} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-layout">
      <Navbar />
      <main className="main-content">
        <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 960 }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Report a Civic Issue</h1>
            <p style={{ color: 'var(--gray-500)' }}>Help improve your city by reporting problems that need attention.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Left column */}
              <div>
                {/* Category */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-body">
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      📌 Issue Category <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>*</span>
                    </h3>

                    {/* AI Suggestion */}
                    {(aiLoading || aiSuggestion) && !aiAccepted && (
                      <div className="ai-suggestion" style={{ marginBottom: '1rem' }}>
                        <div className="ai-suggestion-left">
                          <Sparkles size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          {aiLoading ? (
                            <span style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                              <span className="spinner" style={{ display: 'inline-block', width: 12, height: 12, marginRight: 6, borderColor: 'var(--gray-200)', borderTopColor: 'var(--primary)' }} />
                              AI is analyzing...
                            </span>
                          ) : (
                            <span className="ai-suggestion-text">
                              AI Suggested: <strong>{aiSuggestion}</strong>
                            </span>
                          )}
                        </div>
                        {aiSuggestion && !aiLoading && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-primary btn-sm" onClick={acceptAiSuggestion}>
                              <CheckCircle size={13} /> Accept
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAiSuggestion(null)}>
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="category-grid">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.name}
                          type="button"
                          className={`category-item ${form.category === cat.name ? 'selected' : ''}`}
                          onClick={() => setForm(f => ({ ...f, category: cat.name }))}
                        >
                          <span className="category-item-icon">{cat.icon}</span>
                          <span className="category-item-name">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                    {errors.category && <div className="form-error" style={{ marginTop: 8 }}>{errors.category}</div>}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-body">
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>📝 Issue Details</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Issue Title <span>*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Brief title describing the issue"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        maxLength={100}
                      />
                      {errors.title && <div className="form-error">{errors.title}</div>}
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Description <span>*</span></label>
                      <textarea
                        className="form-textarea"
                        placeholder="Describe the issue in detail — what it is, how long it's been there, any safety concerns..."
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={5}
                      />
                      {errors.description && <div className="form-error">{errors.description}</div>}
                    </div>
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="card">
                  <div className="card-body">
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>📸 Upload Photo</h3>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />

                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        {uploadingImage && (
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '0.9rem', fontWeight: 600
                          }}>
                            <Loader size={20} style={{ marginRight: 8, animation: 'spin 0.7s linear infinite' }} />
                            Uploading...
                          </div>
                        )}
                        {!uploadingImage && (
                          <button type="button" className="image-preview-remove" onClick={removeImage}>
                            <X size={16} />
                          </button>
                        )}
                        {!uploadingImage && imageUrl && (
                          <div style={{
                            position: 'absolute', bottom: 8, left: 8,
                            background: 'rgba(22, 163, 74, 0.9)', color: 'white',
                            padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600
                          }}>
                            ✓ Uploaded
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="upload-zone"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
                        onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
                        onDrop={e => {
                          e.preventDefault()
                          e.currentTarget.classList.remove('drag-over')
                          const file = e.dataTransfer.files[0]
                          if (file) {
                            const input = fileInputRef.current
                            if (input) {
                              const dt = new DataTransfer()
                              dt.items.add(file)
                              input.files = dt.files
                              handleImageChange({ target: input } as React.ChangeEvent<HTMLInputElement>)
                            }
                          }
                        }}
                      >
                        <div className="upload-zone-icon"><Upload size={40} strokeWidth={1.5} style={{ color: 'var(--gray-300)' }} /></div>
                        <div className="upload-zone-text">Click or drag to upload photo</div>
                        <div className="upload-zone-hint">JPG, PNG, WEBP • Max 10MB</div>
                      </div>
                    )}

                    {imageError && (
                      <div className="alert alert-error" style={{ marginTop: 8 }}>
                        <AlertTriangle size={16} /> {imageError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column — Map */}
              <div>
                <div className="card" style={{ position: 'sticky', top: '90px' }}>
                  <div className="card-body">
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>
                      📍 Select Location <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>*</span>
                    </h3>

                    <ReportMap
                      onLocationSelect={loc => {
                        setLocation(loc)
                        if (errors.location) setErrors(e => ({ ...e, location: '' }))
                      }}
                    />

                    {errors.location && (
                      <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>
                        <AlertTriangle size={16} /> {errors.location}
                      </div>
                    )}

                    {location && (
                      <div style={{
                        marginTop: '0.75rem', padding: '0.75rem 1rem',
                        background: 'var(--primary-50)', border: '1px solid var(--primary-200)',
                        borderRadius: 'var(--radius-md)', fontSize: '0.85rem'
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>✓ Location Selected</div>
                        <div style={{ color: 'var(--gray-600)' }}>
                          {location.lat.toFixed(6)}°N, {location.lng.toFixed(6)}°E
                        </div>
                        {location.address && (
                          <div style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginTop: 4, lineHeight: 1.4 }}>
                            📍 {location.address}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Duplicate Warning */}
            {duplicate && !skipDuplicate && (
              <div className="duplicate-alert" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠️ Possible Duplicate Issue Found</div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--gray-700)', marginBottom: 8 }}>
                      A similar <strong>{form.category}</strong> complaint was reported nearby: <strong>"{duplicate.title}"</strong> (Status: {duplicate.status})
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <a href={`/complaints/${duplicate.id}`} target="_blank" className="btn btn-secondary btn-sm">
                        View Existing Issue
                      </a>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => { setSkipDuplicate(true); setDuplicate(null) }}
                      >
                        Submit Anyway (Different Issue)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                ⚠️ {submitError}
              </div>
            )}

            {/* Submit button */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => router.push('/dashboard')}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting || uploadingImage}
              >
                {submitting ? (
                  <><div className="spinner" /> Submitting...</>
                ) : (
                  '📤 Submit Complaint'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
