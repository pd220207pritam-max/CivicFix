import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, role } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'CITIZEN'
    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone: phone || null, role: userRole },
      select: { id: true, name: true, email: true, role: true },
    })

    // Welcome notification
    await prisma.notification.create({
      data: {
        title: 'Welcome to CivicFix! 🎉',
        message: 'Thank you for joining CivicFix. Start by reporting your first civic issue.',
        type: 'success',
        userId: user.id,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
