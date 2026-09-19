import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const userId = (session.user as { id?: string }).id!
    const { note } = await req.json()

    if (!note?.trim()) {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 })
    }

    const adminNote = await prisma.adminNote.create({
      data: {
        note,
        complaintId: params.id,
        authorId: userId,
      },
      include: { author: { select: { name: true } } },
    })

    return NextResponse.json({ note: adminNote }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}
