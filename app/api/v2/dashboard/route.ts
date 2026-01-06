import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getWeekStartEnd(date: Date = new Date()) {
  const d = new Date(date)
  const dayOfWeek = d.getDay()
  const startOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  
  const weekStart = new Date(d)
  weekStart.setDate(d.getDate() + startOffset)
  weekStart.setHours(0, 0, 0, 0)
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  
  const format = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }
  
  return { weekStart: format(weekStart), weekEnd: format(weekEnd) }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId')

  if (!childId) {
    return NextResponse.json({ error: 'Child ID required' }, { status: 400 })
  }

  try {
    // Get user's family_id for authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', user.id)
      .single()

    if (!profile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 })
    }

    // Verify child belongs to family
    const { data: child } = await supabase
      .from('children')
      .select('id, name')
      .eq('id', childId)
      .eq('family_id', profile.family_id)
      .single()

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Get configuration
    const { data: config } = await supabase
      .from('configurations')
      .select('*')
      .eq('family_id', profile.family_id)
      .single()

    const pointsToMinutes = config?.points_to_minutes || 5
    const pointsToDollars = config?.points_to_dollars || 0.5
    const christmasGoal = config?.christmas_goal || 500
    const maxWeeklyScreenTime = config?.max_weekly_screen_time || 420

    // Get current week data
    const { weekStart, weekEnd } = getWeekStartEnd()
    const { data: currentWeekData } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('child_id', childId)
      .gte('date', weekStart)
      .lte('date', weekEnd)

    // Calculate current week stats - sum category_points objects
    const currentWeekPoints = currentWeekData?.reduce((sum, d) => {
      const categorySum = Object.values(d.category_points || {}).reduce((s: number, v) => s + (Number(v) || 0), 0)
      return sum + categorySum + (d.daily_bonuses || 0) + (d.daily_deductions || 0)
    }, 0) || 0
    const currentWeekScreenTime = currentWeekPoints * pointsToMinutes
    const currentWeekAllowance = currentWeekPoints * pointsToDollars
    const daysTracked = currentWeekData?.length || 0
    const averageDaily = daysTracked > 0 ? Math.round(currentWeekPoints / daysTracked) : 0

    // Get year to date for Christmas fund
    const yearStart = `${new Date().getFullYear()}-01-01`
    const { data: yearData } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('child_id', childId)
      .gte('date', yearStart)

    const yearTotalPoints = yearData?.reduce((sum, d) => {
      const categorySum = Object.values(d.category_points || {}).reduce((s: number, v) => s + (Number(v) || 0), 0)
      return sum + categorySum + (d.daily_bonuses || 0) + (d.daily_deductions || 0)
    }, 0) || 0
    // 10% goes to Christmas fund
    const christmasSavings = yearTotalPoints * pointsToDollars * 0.1
    const christmasProgress = Math.min((christmasSavings / christmasGoal) * 100, 100)

    // Get this month data
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const { data: monthData } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('child_id', childId)
      .gte('date', monthStart)

    const monthPoints = monthData?.reduce((sum, d) => {
      const categorySum = Object.values(d.category_points || {}).reduce((s: number, v) => s + (Number(v) || 0), 0)
      return sum + categorySum + (d.daily_bonuses || 0) + (d.daily_deductions || 0)
    }, 0) || 0
    const monthScreenTime = monthPoints * pointsToMinutes
    const monthAllowance = monthPoints * pointsToDollars

    // Get behavior trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    
    const { data: trendsData } = await supabase
      .from('daily_tracking')
      .select('date, category_points, daily_bonuses, daily_deductions')
      .eq('child_id', childId)
      .gte('date', thirtyDaysAgoStr)
      .order('date', { ascending: true })

    const behaviorTrends = (trendsData || []).map(d => {
      const categorySum = Object.values(d.category_points || {}).reduce((s: number, v) => s + (Number(v) || 0), 0)
      return {
        date: d.date,
        points: categorySum + (d.daily_bonuses || 0) + (d.daily_deductions || 0),
        categories: d.category_points || {},
      }
    })

    // Get recent weeks
    const { data: recentWeeksData } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('child_id', childId)
      .order('week_start', { ascending: false })
      .limit(4)

    const recentWeeks = (recentWeeksData || []).map(w => ({
      weekStart: w.week_start,
      weekEnd: w.week_end,
      totalPoints: w.total_points || 0,
      screenTime: w.screen_time_earned || 0,
      allowance: w.allowance_earned || 0,
      isPaid: w.is_paid || false,
    }))

    return NextResponse.json({
      child: {
        id: child.id,
        name: child.name,
      },
      currentWeek: {
        weekStart,
        weekEnd,
        totalPoints: currentWeekPoints,
        screenTime: currentWeekScreenTime,
        maxScreenTime: maxWeeklyScreenTime,
        allowance: currentWeekAllowance,
        daysTracked,
        averageDaily,
      },
      christmasFund: {
        current: christmasSavings,
        goal: christmasGoal,
        progress: christmasProgress,
      },
      thisMonth: {
        totalPoints: monthPoints,
        screenTime: monthScreenTime,
        allowance: monthAllowance,
      },
      behaviorTrends,
      recentWeeks,
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
