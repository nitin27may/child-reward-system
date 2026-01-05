import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_CATEGORIES = [
  { name: 'Health & Nutrition', key: 'healthNutrition', icon: '🥗', maxPoints: 3, orderIndex: 0, description: 'Track healthy eating habits' },
  { name: 'Screen Discipline', key: 'screenDiscipline', icon: '📱', maxPoints: 2, orderIndex: 1, description: 'Following screen time rules' },
  { name: 'Self-Study & Learning', key: 'selfStudy', icon: '📚', maxPoints: 2, orderIndex: 2, description: 'Reading and educational activities' },
  { name: 'Household Contribution', key: 'household', icon: '🏠', maxPoints: 3, orderIndex: 3, description: 'Helping with chores and responsibilities' },
  { name: 'Behavior & Respect', key: 'behaviorRespect', icon: '⭐', maxPoints: 2, orderIndex: 4, description: 'Respectful and positive behavior' },
]

const DEFAULT_BONUSES = [
  { label: 'Perfect sugar-free day', points: 2, orderIndex: 0, description: 'No sugary drinks or extra snacks all day' },
  { label: 'Extraordinary helpfulness', points: 3, orderIndex: 1, description: 'Going above and beyond to help others' },
  { label: 'Homework ahead of schedule', points: 2, orderIndex: 2, description: 'Completing assignments early' },
  { label: 'Helped sibling/peer without prompting', points: 2, orderIndex: 3, description: 'Showing kindness unprompted' },
  { label: 'Perfect week bonus', points: 10, orderIndex: 4, description: 'Earned all base points for the week' },
]

const DEFAULT_DEDUCTIONS = [
  { label: 'Disrespectful behavior', points: -2, orderIndex: 0, description: 'Talking back or being rude' },
  { label: 'Refused to do assigned chore', points: -3, orderIndex: 1, description: 'Not completing required tasks' },
  { label: 'Lied about completing something', points: -5, orderIndex: 2, description: 'Being dishonest' },
  { label: 'Physical aggression', points: -5, orderIndex: 3, description: 'Hitting, throwing things, etc.' },
  { label: 'Sneaking screen time', points: -5, orderIndex: 4, description: 'Using devices without permission' },
  { label: 'Morning routine not completed', points: -1, orderIndex: 5, description: 'Not finishing morning tasks' },
  { label: 'Tantrum/meltdown', points: -3, orderIndex: 6, description: 'Age-inappropriate emotional outburst' },
]

export async function POST() {
  try {
    // Check if already initialized
    const existingCategories = await prisma.category.count()
    if (existingCategories > 0) {
      return NextResponse.json({
        message: 'System already initialized',
        alreadyInitialized: true,
      })
    }

    // Create default configuration
    const existingConfig = await prisma.configuration.findFirst()
    if (!existingConfig) {
      await prisma.configuration.create({
        data: {
          pointsToMinutes: 0.5,
          pointsToDollars: 1.0,
          christmasGoal: 500.0,
          maxWeeklyScreenTime: 60,
        },
      })
    }

    // Create default categories
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES,
    })

    // Create default bonuses
    await prisma.bonusPreset.createMany({
      data: DEFAULT_BONUSES,
    })

    // Create default deductions
    await prisma.deductionPreset.createMany({
      data: DEFAULT_DEDUCTIONS,
    })

    return NextResponse.json({
      message: 'System initialized successfully',
      categories: DEFAULT_CATEGORIES.length,
      bonuses: DEFAULT_BONUSES.length,
      deductions: DEFAULT_DEDUCTIONS.length,
    })
  } catch (error) {
    console.error('Error initializing system:', error)
    return NextResponse.json(
      { error: 'Failed to initialize system' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const categoriesCount = await prisma.category.count()
    const bonusesCount = await prisma.bonusPreset.count()
    const deductionsCount = await prisma.deductionPreset.count()
    const hasConfig = (await prisma.configuration.count()) > 0

    return NextResponse.json({
      initialized: categoriesCount > 0,
      categories: categoriesCount,
      bonuses: bonusesCount,
      deductions: deductionsCount,
      hasConfig,
    })
  } catch (error) {
    console.error('Error checking initialization:', error)
    return NextResponse.json(
      { error: 'Failed to check initialization status' },
      { status: 500 }
    )
  }
}
