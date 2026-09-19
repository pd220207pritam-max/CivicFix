import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const { city, region, country, latitude, longitude } = body

    // Extract device/browser from User-Agent
    const ua = req.headers.get('user-agent') || ''
    let browser = 'Unknown'
    let device = 'Desktop'

    if (ua.includes('Mobile') || ua.includes('Android')) device = 'Mobile'
    else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet'

    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Edg')) browser = 'Edge'

    // Get IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') || 'Unknown'

    await prisma.loginActivity.create({
      data: {
        userId: user.id,
        ip,
        city: city || null,
        region: region || null,
        country: country || null,
        latitude: latitude || null,
        longitude: longitude || null,
        device,
        browser,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login activity error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (admin?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const activities = await prisma.loginActivity.findMany({
      orderBy: { loginAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true, role: true, createdAt: true } }
      }
    })

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, phone: true, createdAt: true,
        loginActivities: { orderBy: { loginAt: 'desc' }, take: 1 }
      }
    })

    return NextResponse.json({ activities, users })
  } catch (error) {
    console.error('Get login activity error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
