import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DEFAULT_CATEGORIES = [
  { name: 'Health & Nutrition', key: 'health_nutrition', icon: '🥗', max_points: 3, order_index: 0 },
  { name: 'Screen Discipline', key: 'screen_discipline', icon: '📱', max_points: 2, order_index: 1 },
  { name: 'Self-Study & Learning', key: 'self_study', icon: '📚', max_points: 2, order_index: 2 },
  { name: 'Household Contribution', key: 'household', icon: '🏠', max_points: 3, order_index: 3 },
  { name: 'Behavior & Respect', key: 'behavior_respect', icon: '⭐', max_points: 2, order_index: 4 },
]

const DEFAULT_BONUSES = [
  { label: 'Perfect sugar-free day', points: 2, order_index: 0 },
  { label: 'Extraordinary helpfulness', points: 3, order_index: 1 },
  { label: 'Homework ahead of schedule', points: 2, order_index: 2 },
  { label: 'Helped sibling/peer without prompting', points: 2, order_index: 3 },
  { label: 'Perfect week bonus', points: 10, order_index: 4 },
]

const DEFAULT_DEDUCTIONS = [
  { label: 'Disrespectful behavior', points: -2, order_index: 0 },
  { label: 'Refused to do assigned chore', points: -3, order_index: 1 },
  { label: 'Lied about completing something', points: -5, order_index: 2 },
  { label: 'Physical aggression', points: -5, order_index: 3 },
  { label: 'Sneaking screen time', points: -5, order_index: 4 },
  { label: 'Morning routine not completed', points: -1, order_index: 5 },
  { label: 'Tantrum/meltdown', points: -3, order_index: 6 },
]

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's family_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', user.id)
      .single()

    if (!profile?.family_id) {
      return NextResponse.json({ initialized: false, categories: 0, bonuses: 0, deductions: 0 })
    }

    // Count existing data for this family
    const [categoriesRes, bonusesRes, deductionsRes, configRes] = await Promise.all([
      supabase.from('categories').select('id', { count: 'exact', head: true }).eq('family_id', profile.family_id),
      supabase.from('bonus_presets').select('id', { count: 'exact', head: true }).eq('family_id', profile.family_id),
      supabase.from('deduction_presets').select('id', { count: 'exact', head: true }).eq('family_id', profile.family_id),
      supabase.from('configurations').select('id', { count: 'exact', head: true }).eq('family_id', profile.family_id),
    ])

    const categoriesCount = categoriesRes.count || 0
    const bonusesCount = bonusesRes.count || 0
    const deductionsCount = deductionsRes.count || 0
    const hasConfig = (configRes.count || 0) > 0

    return NextResponse.json({
      initialized: categoriesCount > 0,
      categories: categoriesCount,
      bonuses: bonusesCount,
      deductions: deductionsCount,
      hasConfig,
    })
  } catch (error) {
    console.error('Error checking initialization:', error)
    return NextResponse.json({ error: 'Failed to check initialization' }, { status: 500 })
  }
}

export async function POST() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's family_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', user.id)
      .single()

    if (!profile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 })
    }

    const familyId = profile.family_id

    // Check if already initialized
    const { count: existingCategories } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('family_id', familyId)

    if (existingCategories && existingCategories > 0) {
      return NextResponse.json({
        message: 'System already initialized',
        alreadyInitialized: true,
      })
    }

    // Create default configuration
    const { count: existingConfig } = await supabase
      .from('configurations')
      .select('id', { count: 'exact', head: true })
      .eq('family_id', familyId)

    if (!existingConfig || existingConfig === 0) {
      await supabase.from('configurations').insert({
        family_id: familyId,
        points_to_minutes: 0.5,
        points_to_dollars: 1.0,
        christmas_goal: 500.0,
        max_weekly_screen_time: 60,
      })
    }

    // Create default categories
    await supabase.from('categories').insert(
      DEFAULT_CATEGORIES.map(cat => ({ ...cat, family_id: familyId, is_active: true }))
    )

    // Create default bonuses
    await supabase.from('bonus_presets').insert(
      DEFAULT_BONUSES.map(bonus => ({ ...bonus, family_id: familyId, is_active: true }))
    )

    // Create default deductions
    await supabase.from('deduction_presets').insert(
      DEFAULT_DEDUCTIONS.map(ded => ({ ...ded, family_id: familyId, is_active: true }))
    )

    return NextResponse.json({
      message: 'System initialized successfully',
      categories: DEFAULT_CATEGORIES.length,
      bonuses: DEFAULT_BONUSES.length,
      deductions: DEFAULT_DEDUCTIONS.length,
    })
  } catch (error) {
    console.error('Error initializing system:', error)
    return NextResponse.json({ error: 'Failed to initialize system' }, { status: 500 })
  }
}
