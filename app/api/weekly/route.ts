import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWeekStartEnd, getWeekNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const weekNumber = searchParams.get('weekNumber')

    if (year && weekNumber) {
      const review = await prisma.weeklyReview.findUnique({
        where: {
          weekNumber_year: {
            weekNumber: parseInt(weekNumber),
            year: parseInt(year),
          },
        },
      })
      return NextResponse.json(review)
    }

    const reviews = await prisma.weeklyReview.findMany({
      orderBy: { weekStartDate: 'desc' },
      take: 20,
    })
    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching weekly reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weekly reviews' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      date,
      screenTimeUsed,
      notes,
      behaviorGoalNextWeek,
    } = body

    const dateObj = new Date(date)
    const { start: weekStart, end: weekEnd } = getWeekStartEnd(dateObj)
    const weekNum = getWeekNumber(dateObj)
    const year = dateObj.getFullYear()

    const weekTracking = await prisma.dailyTracking.findMany({
      where: {
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: { bonusEvents: true },
    })

    const totalScreenPoints = weekTracking.reduce(
      (sum, day) => sum + day.screenTimeTotal,
      0
    )
    const christmasFundPoints = weekTracking.reduce(
      (sum, day) => sum + day.christmasFundTotal,
      0
    )
    const totalBonuses = weekTracking.reduce(
      (sum, day) => sum + day.dailyBonuses,
      0
    )
    const totalDeductions = weekTracking.reduce(
      (sum, day) => sum + Math.abs(day.dailyDeductions),
      0
    )

    const config = await prisma.configuration.findFirst()
    const screenTimeEarned = Math.min(
      Math.floor(totalScreenPoints * (config?.pointsToMinutes ?? 0.5)),
      config?.maxWeeklyScreenTime ?? 60
    )

    const allTimeTracking = await prisma.dailyTracking.findMany({
      where: {
        date: {
          lte: weekEnd,
        },
      },
    })
    const christmasFundCumulative =
      allTimeTracking.reduce((sum, day) => sum + day.christmasFundTotal, 0) *
      (config?.pointsToDollars ?? 1.0)

    const deductionCategories: Record<string, number> = {}
    const bonusCategories: Record<string, number> = {}

    weekTracking.forEach((day) => {
      day.bonusEvents.forEach((event) => {
        if (event.type === 'deduction') {
          deductionCategories[event.category] =
            (deductionCategories[event.category] || 0) + 1
        } else {
          bonusCategories[event.category] =
            (bonusCategories[event.category] || 0) + 1
        }
      })
    })

    const commonDeductions = Object.entries(deductionCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)

    const commonBonuses = Object.entries(bonusCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)

    const review = await prisma.weeklyReview.upsert({
      where: {
        weekNumber_year: {
          weekNumber: weekNum,
          year: year,
        },
      },
      update: {
        totalScreenPoints,
        screenTimeEarned,
        screenTimeUsed: screenTimeUsed ?? screenTimeEarned,
        christmasFundPoints,
        christmasFundCumulative,
        totalBonuses,
        totalDeductions,
        commonDeductions: JSON.stringify(commonDeductions),
        commonBonuses: JSON.stringify(commonBonuses),
        notes,
        behaviorGoalNextWeek,
      },
      create: {
        weekNumber: weekNum,
        year: year,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        totalScreenPoints,
        screenTimeEarned,
        screenTimeUsed: screenTimeUsed ?? screenTimeEarned,
        christmasFundPoints,
        christmasFundCumulative,
        totalBonuses,
        totalDeductions,
        commonDeductions: JSON.stringify(commonDeductions),
        commonBonuses: JSON.stringify(commonBonuses),
        notes,
        behaviorGoalNextWeek,
      },
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error saving weekly review:', error)
    return NextResponse.json(
      { error: 'Failed to save weekly review' },
      { status: 500 }
    )
  }
}
