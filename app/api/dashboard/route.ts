import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWeekStartEnd, getWeekNumber } from '@/lib/utils'

export async function GET() {
  try {
    const now = new Date()
    const { start: weekStart, end: weekEnd } = getWeekStartEnd(now)

    const config = await prisma.configuration.findFirst()

    const thisWeekTracking = await prisma.dailyTracking.findMany({
      where: {
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: { date: 'asc' },
      include: { bonusEvents: true },
    })

    const weekScreenPoints = thisWeekTracking.reduce(
      (sum, day) => sum + day.screenTimeTotal,
      0
    )

    const screenTimeEarned = Math.min(
      Math.floor(weekScreenPoints * (config?.pointsToMinutes ?? 0.5)),
      config?.maxWeeklyScreenTime ?? 60
    )

    const allTimeTracking = await prisma.dailyTracking.findMany({
      orderBy: { date: 'asc' },
    })

    const christmasFundTotal = allTimeTracking.reduce(
      (sum, day) => sum + day.christmasFundTotal,
      0
    )

    const christmasFundDollars = christmasFundTotal * (config?.pointsToDollars ?? 1.0)

    const recentWeeks = await prisma.weeklyReview.findMany({
      orderBy: { weekStartDate: 'desc' },
      take: 10,
    })

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const thisMonthTracking = await prisma.dailyTracking.findMany({
      where: {
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    })

    const monthScreenPoints = thisMonthTracking.reduce(
      (sum, day) => sum + day.screenTimeTotal,
      0
    )
    const monthChristmasFundPoints = thisMonthTracking.reduce(
      (sum, day) => sum + day.christmasFundTotal,
      0
    )
    const monthBonuses = thisMonthTracking.reduce(
      (sum, day) => sum + day.dailyBonuses,
      0
    )
    const monthDeductions = thisMonthTracking.reduce(
      (sum, day) => sum + Math.abs(day.dailyDeductions),
      0
    )

    const allBonusDeductions = await prisma.bonusDeduction.findMany({
      where: {
        date: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    })

    const deductionCategories: Record<string, number> = {}
    const bonusCategories: Record<string, number> = {}

    allBonusDeductions.forEach((event) => {
      if (event.type === 'deduction') {
        deductionCategories[event.category] =
          (deductionCategories[event.category] || 0) + 1
      } else {
        bonusCategories[event.category] = (bonusCategories[event.category] || 0) + 1
      }
    })

    const commonDeductions = Object.entries(deductionCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    const commonBonuses = Object.entries(bonusCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    const daysUntilWeekend = 6 - now.getDay()

    return NextResponse.json({
      currentWeek: {
        weekNumber: getWeekNumber(now),
        year: now.getFullYear(),
        screenPoints: weekScreenPoints,
        screenTimeEarned,
        daysUntilWeekend,
        dailyData: thisWeekTracking,
      },
      christmasFund: {
        goal: config?.christmasGoal ?? 500,
        current: christmasFundDollars,
        points: christmasFundTotal,
        percentage: Math.round(
          (christmasFundDollars / (config?.christmasGoal ?? 500)) * 100
        ),
      },
      thisMonth: {
        screenPoints: monthScreenPoints,
        christmasFundPoints: monthChristmasFundPoints,
        bonuses: monthBonuses,
        deductions: monthDeductions,
      },
      behaviorTrends: {
        commonDeductions,
        commonBonuses,
      },
      recentWeeks,
      config,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
