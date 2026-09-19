// Utility functions for CivicFix

export const CATEGORIES = [
  { name: 'Pothole', icon: '🕳️', color: '#dc2626' },
  { name: 'Garbage', icon: '🗑️', color: '#16a34a' },
  { name: 'Broken Streetlight', icon: '💡', color: '#d97706' },
  { name: 'Water Leakage', icon: '💧', color: '#2563eb' },
  { name: 'Drainage Problem', icon: '🌊', color: '#0891b2' },
  { name: 'Damaged Road', icon: '🛣️', color: '#9f1239' },
  { name: 'Traffic Signal', icon: '🚦', color: '#7c3aed' },
  { name: 'Public Toilet', icon: '🚻', color: '#0369a1' },
  { name: 'Illegal Dumping', icon: '⚠️', color: '#b45309' },
  { name: 'Other', icon: '📋', color: '#4b5563' },
]

export const STATUSES = [
  { name: 'Submitted', color: '#6b7280', bg: '#f3f4f6', label: 'Submitted' },
  { name: 'Under Review', color: '#d97706', bg: '#fef3c7', label: 'Under Review' },
  { name: 'Assigned', color: '#2563eb', bg: '#dbeafe', label: 'Assigned' },
  { name: 'In Progress', color: '#7c3aed', bg: '#ede9fe', label: 'In Progress' },
  { name: 'Resolved', color: '#16a34a', bg: '#dcfce7', label: 'Resolved' },
  { name: 'Rejected', color: '#dc2626', bg: '#fee2e2', label: 'Rejected' },
]

export function getCategoryInfo(category: string) {
  return CATEGORIES.find((c) => c.name === category) || CATEGORIES[CATEGORIES.length - 1]
}

export function getStatusInfo(status: string) {
  return STATUSES.find((s) => s.name === status) || STATUSES[0]
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(date: Date | string) {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return formatDate(date)
}

export function generateComplaintId(id: string) {
  return 'CF' + id.slice(-6).toUpperCase()
}
