import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const deductions = await prisma.deductionPreset.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    })
    return NextResponse.json(deductions)
  } catch (error) {
    console.error('Error fetching deductions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deductions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { label, points, orderIndex, description } = body

    const deduction = await prisma.deductionPreset.create({
      data: {
        label,
        points: -Math.abs(points), // ensure negative
        orderIndex: orderIndex ?? 0,
        description,
      },
    })

    return NextResponse.json(deduction)
  } catch (error) {
    console.error('Error creating deduction:', error)
    return NextResponse.json(
      { error: 'Failed to create deduction' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, label, points, orderIndex, isActive, description } = body

    const deduction = await prisma.deductionPreset.update({
      where: { id },
      data: {
        label,
        points: -Math.abs(points),
        orderIndex,
        isActive,
        description,
      },
    })

    return NextResponse.json(deduction)
  } catch (error) {
    console.error('Error updating deduction:', error)
    return NextResponse.json(
      { error: 'Failed to update deduction' },
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
        { error: 'Deduction ID is required' },
        { status: 400 }
      )
    }

    await prisma.deductionPreset.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting deduction:', error)
    return NextResponse.json(
      { error: 'Failed to delete deduction' },
      { status: 500 }
    )
  }
}
