import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let config = await prisma.configuration.findFirst()

    if (!config) {
      config = await prisma.configuration.create({
        data: {
          pointsToMinutes: 0.5,
          pointsToDollars: 1.0,
          christmasGoal: 500.0,
          maxWeeklyScreenTime: 60,
        },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { pointsToMinutes, pointsToDollars, christmasGoal, maxWeeklyScreenTime } = body

    let config = await prisma.configuration.findFirst()

    if (!config) {
      config = await prisma.configuration.create({
        data: {
          pointsToMinutes: pointsToMinutes ?? 0.5,
          pointsToDollars: pointsToDollars ?? 1.0,
          christmasGoal: christmasGoal ?? 500.0,
          maxWeeklyScreenTime: maxWeeklyScreenTime ?? 60,
        },
      })
    } else {
      config = await prisma.configuration.update({
        where: { id: config.id },
        data: {
          pointsToMinutes: pointsToMinutes ?? config.pointsToMinutes,
          pointsToDollars: pointsToDollars ?? config.pointsToDollars,
          christmasGoal: christmasGoal ?? config.christmasGoal,
          maxWeeklyScreenTime: maxWeeklyScreenTime ?? config.maxWeeklyScreenTime,
        },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}
