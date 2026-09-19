import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { complaints: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ departments })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
  }
}
