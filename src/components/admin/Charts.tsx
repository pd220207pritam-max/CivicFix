'use client'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const CATEGORY_COLORS = [
  '#dc2626', '#16a34a', '#d97706', '#2563eb', '#0891b2',
  '#9f1239', '#7c3aed', '#0369a1', '#b45309', '#4b5563'
]

export default function Charts({ type, data }: { type: 'category' | 'status', data: unknown }) {
  if (type === 'category') {
    const cats = data as Array<{ category: string; _count: { id: number } }>
    if (!cats || cats.length === 0) return <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No data</div>
    
    return (
      <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Doughnut
          data={{
            labels: cats.map(c => c.category),
            datasets: [{
              data: cats.map(c => c._count.id),
              backgroundColor: CATEGORY_COLORS.slice(0, cats.length),
              borderWidth: 2,
              borderColor: '#fff',
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: { boxWidth: 12, font: { size: 11 }, padding: 8 },
              },
            },
          }}
        />
      </div>
    )
  }

  if (type === 'status') {
    const s = data as { submitted: number; underReview: number; assigned: number; inProgress: number; resolved: number; rejected: number }
    
    return (
      <div style={{ height: 250 }}>
        <Bar
          data={{
            labels: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
            datasets: [{
              label: 'Complaints',
              data: [s.submitted, s.underReview, s.assigned, s.inProgress, s.resolved, s.rejected],
              backgroundColor: ['#6b7280', '#d97706', '#2563eb', '#7c3aed', '#16a34a', '#dc2626'],
              borderRadius: 6,
              borderWidth: 0,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } },
              x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            },
          }}
        />
      </div>
    )
  }

  return null
}
