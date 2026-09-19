import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const [total, resolved, inProgress, submitted, underReview, assigned, rejected] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'Resolved' } }),
      prisma.complaint.count({ where: { status: 'In Progress' } }),
      prisma.complaint.count({ where: { status: 'Submitted' } }),
      prisma.complaint.count({ where: { status: 'Under Review' } }),
      prisma.complaint.count({ where: { status: 'Assigned' } }),
      prisma.complaint.count({ where: { status: 'Rejected' } }),
    ])

    // Category breakdown
    const byCategory = await prisma.complaint.groupBy({
      by: ['category'],
      _count: { id: true },
    })

    // Recent trend (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const thisWeek = await prisma.complaint.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })

    return NextResponse.json({
      total,
      resolved,
      inProgress,
      submitted,
      underReview,
      assigned,
      rejected,
      active: total - resolved - rejected,
      byCategory,
      thisWeek,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
