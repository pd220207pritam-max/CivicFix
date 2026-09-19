import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const departmentId = searchParams.get('department')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    
    const where: Record<string, unknown> = {}
    
    // If userId filter, show only that user's complaints
    if (userId) where.userId = userId
    
    // Category filter
    if (category && category !== 'all') where.category = category
    
    // Status filter
    if (status && status !== 'all') where.status = status
    
    // Department filter
    if (departmentId && departmentId !== 'all') where.departmentId = departmentId
    
    // Search
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
      ]
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true, color: true } },
          _count: { select: { statusHistory: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where }),
    ])

    return NextResponse.json({ complaints, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Get complaints error:', error)
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id?: string }).id!
    const body = await req.json()
    const { title, description, category, latitude, longitude, address, imageUrl } = body

    if (!title || !description || !category || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Duplicate check removed to prevent UX confusion during hackathon demo

    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        category,
        latitude,
        longitude,
        address: address || null,
        imageUrl: imageUrl || null,
        status: 'Submitted',
        userId,
      },
    })

    // Create initial status history
    await prisma.statusHistory.create({
      data: {
        status: 'Submitted',
        note: 'Complaint submitted by citizen',
        complaintId: complaint.id,
        changedById: userId,
      },
    })

    // Create notification for the user
    await prisma.notification.create({
      data: {
        title: 'Complaint Submitted! ✅',
        message: `Your complaint "${title}" has been received. ID: CF${complaint.id.slice(-6).toUpperCase()}`,
        type: 'success',
        userId,
      },
    })

    return NextResponse.json({ complaint }, { status: 201 })
  } catch (error) {
    console.error('Create complaint error:', error)
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
  }
}
