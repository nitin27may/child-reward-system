import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (date) {
      const tracking = await prisma.dailyTracking.findUnique({
        where: { date: new Date(date) },
        include: { bonusEvents: true },
      })
      return NextResponse.json(tracking)
    }

    if (startDate && endDate) {
      const trackings = await prisma.dailyTracking.findMany({
        where: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: { bonusEvents: true },
        orderBy: { date: 'asc' },
      })
      return NextResponse.json(trackings)
    }

    const trackings = await prisma.dailyTracking.findMany({
      include: { bonusEvents: true },
      orderBy: { date: 'desc' },
      take: 30,
    })
    return NextResponse.json(trackings)
  } catch (error) {
    console.error('Error fetching tracking data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      date,
      healthNutrition,
      screenDiscipline,
      selfStudy,
      household,
      behaviorRespect,
      dailyBonuses,
      dailyDeductions,
      notes,
      bonusEvents,
    } = body

    const dateObj = new Date(date)
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' })

    const screenTimeTotal =
      healthNutrition +
      screenDiscipline +
      selfStudy +
      household +
      behaviorRespect +
      dailyBonuses +
      dailyDeductions

    const christmasFundTotal = screenTimeTotal

    const tracking = await prisma.dailyTracking.upsert({
      where: { date: dateObj },
      update: {
        healthNutrition,
        screenDiscipline,
        selfStudy,
        household,
        behaviorRespect,
        dailyBonuses,
        dailyDeductions,
        screenTimeTotal,
        christmasFundTotal,
        notes,
      },
      create: {
        date: dateObj,
        dayOfWeek,
        healthNutrition,
        screenDiscipline,
        selfStudy,
        household,
        behaviorRespect,
        dailyBonuses,
        dailyDeductions,
        screenTimeTotal,
        christmasFundTotal,
        notes,
      },
    })

    if (bonusEvents && bonusEvents.length > 0) {
      await prisma.bonusDeduction.deleteMany({
        where: { trackingId: tracking.id },
      })

      await prisma.bonusDeduction.createMany({
        data: bonusEvents.map((event: any) => ({
          ...event,
          date: dateObj,
          trackingId: tracking.id,
        })),
      })
    }

    const updatedTracking = await prisma.dailyTracking.findUnique({
      where: { id: tracking.id },
      include: { bonusEvents: true },
    })

    return NextResponse.json(updatedTracking)
  } catch (error) {
    console.error('Error saving tracking data:', error)
    return NextResponse.json(
      { error: 'Failed to save tracking data' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    await prisma.dailyTracking.delete({
      where: { date: new Date(date) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tracking data:', error)
    return NextResponse.json(
      { error: 'Failed to delete tracking data' },
      { status: 500 }
    )
  }
}
