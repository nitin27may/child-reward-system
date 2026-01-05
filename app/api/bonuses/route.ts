import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const bonuses = await prisma.bonusPreset.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    })
    return NextResponse.json(bonuses)
  } catch (error) {
    console.error('Error fetching bonuses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bonuses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { label, points, orderIndex, description } = body

    const bonus = await prisma.bonusPreset.create({
      data: {
        label,
        points: Math.abs(points), // ensure positive
        orderIndex: orderIndex ?? 0,
        description,
      },
    })

    return NextResponse.json(bonus)
  } catch (error) {
    console.error('Error creating bonus:', error)
    return NextResponse.json(
      { error: 'Failed to create bonus' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, label, points, orderIndex, isActive, description } = body

    const bonus = await prisma.bonusPreset.update({
      where: { id },
      data: {
        label,
        points: Math.abs(points),
        orderIndex,
        isActive,
        description,
      },
    })

    return NextResponse.json(bonus)
  } catch (error) {
    console.error('Error updating bonus:', error)
    return NextResponse.json(
      { error: 'Failed to update bonus' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Bonus ID is required' },
        { status: 400 }
      )
    }

    await prisma.bonusPreset.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bonus:', error)
    return NextResponse.json(
      { error: 'Failed to delete bonus' },
      { status: 500 }
    )
  }
}
