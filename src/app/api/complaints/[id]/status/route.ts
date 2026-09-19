import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const userId = (session.user as { id?: string }).id!
    const { status, note, departmentId } = await req.json()

    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    // Update the complaint
    const updateData: Record<string, unknown> = { status }
    if (departmentId !== undefined) updateData.departmentId = departmentId || null

    const updated = await prisma.complaint.update({
      where: { id: params.id },
      data: updateData,
      include: {
        department: true,
        statusHistory: {
          include: { changedBy: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    // Add status history record
    await prisma.statusHistory.create({
      data: {
        status,
        note: note || getDefaultNote(status),
        complaintId: params.id,
        changedById: userId,
      },
    })

    // Notify citizen if their complaint status changed
    if (complaint.userId !== userId) {
      await prisma.notification.create({
        data: {
          title: getNotificationTitle(status),
          message: getNotificationMessage(complaint.title, status, updated.department?.name),
          type: status === 'Resolved' ? 'success' : status === 'Rejected' ? 'warning' : 'info',
          userId: complaint.userId,
        },
      })
    }

    return NextResponse.json({ complaint: updated })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}

function getDefaultNote(status: string) {
  const notes: Record<string, string> = {
    'Under Review': 'Your complaint is being reviewed by our team.',
    'Assigned': 'Your complaint has been assigned to the relevant department.',
    'In Progress': 'Work has started on your complaint.',
    'Resolved': 'Your complaint has been resolved. Thank you for reporting!',
    'Rejected': 'After review, this complaint has been rejected.',
  }
  return notes[status] || `Status updated to ${status}`
}

function getNotificationTitle(status: string) {
  const titles: Record<string, string> = {
    'Under Review': '🔍 Complaint Under Review',
    'Assigned': '📋 Complaint Assigned',
    'In Progress': '🔧 Work In Progress',
    'Resolved': '✅ Complaint Resolved!',
    'Rejected': '❌ Complaint Rejected',
  }
  return titles[status] || `Status: ${status}`
}

function getNotificationMessage(title: string, status: string, dept?: string) {
  if (status === 'Assigned' && dept) {
    return `Your complaint "${title}" has been assigned to ${dept}.`
  }
  if (status === 'Resolved') {
    return `Great news! Your complaint "${title}" has been marked as resolved.`
  }
  return `Your complaint "${title}" status has been updated to: ${status}.`
}
