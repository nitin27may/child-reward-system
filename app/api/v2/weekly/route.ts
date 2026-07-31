import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { TablesUpdate } from '@/types/supabase'

function getWeekStartEnd(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  
  const dayOfWeek = date.getDay()
  const startOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  
  const weekStart = new Date(year, month - 1, day + startOffset)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  const format = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }
  
  return { weekStart: format(weekStart), weekEnd: format(weekEnd) }
}

/**
 * weekly_summaries.year and .week_number are both `not null` with no default.
 * Mirrors the database's upsert_weekly_summary: the calendar year of the week
 * start, plus get_iso_week_number(week_start) — i.e. Postgres `extract(week …)`,
 * which is the ISO-8601 week.
 */
function getYearAndWeek(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))

  // Shift to the Thursday of this ISO week, then count weeks from Jan 1.
  const isoDay = date.getUTCDay() || 7
  const thursday = new Date(date)
  thursday.setUTCDate(date.getUTCDate() + 4 - isoDay)
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil(
    ((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  )

  return { year: y, weekNumber }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId')
  const weekStart = searchParams.get('weekStart')
  const limit = searchParams.get('limit')

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
      .select('id')
      .eq('id', childId)
      .eq('family_id', profile.family_id)
      .single()

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Get specific week
    if (weekStart) {
      const { data: summary, error } = await supabase
        .from('weekly_summaries')
        .select('*')
        .eq('child_id', childId)
        .eq('week_start', weekStart)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return NextResponse.json(summary || null)
    }

    // Get list of weeks
    const queryLimit = limit ? parseInt(limit) : 10
    const { data: summaries, error } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('child_id', childId)
      .order('week_start', { ascending: false })
      .limit(queryLimit)

    if (error) throw error

    return NextResponse.json(summaries)
  } catch (error) {
    console.error('Error fetching weekly summaries:', error)
    return NextResponse.json({ error: 'Failed to fetch weekly summaries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { childId, date } = body

    if (!childId || !date) {
      return NextResponse.json({ error: 'Child ID and date required' }, { status: 400 })
    }

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
      .select('id')
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

    // Calculate week boundaries
    const { weekStart, weekEnd } = getWeekStartEnd(date)
    const { year, weekNumber } = getYearAndWeek(weekStart)

    // Get all tracking for this week
    const { data: trackingData, error: trackingError } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('child_id', childId)
      .gte('date', weekStart)
      .lte('date', weekEnd)

    if (trackingError) throw trackingError

    // Calculate totals
    const totalPoints = (trackingData || []).reduce((sum, d) => sum + (d.total_points || 0), 0)
    const screenTimeEarned = totalPoints * pointsToMinutes
    const allowanceEarned = totalPoints * pointsToDollars

    // Upsert weekly summary
    const { data: summary, error: summaryError } = await supabase
      .from('weekly_summaries')
      .upsert({
        child_id: childId,
        year,
        week_number: weekNumber,
        week_start: weekStart,
        week_end: weekEnd,
        total_points: totalPoints,
        screen_time_earned: screenTimeEarned,
        allowance_earned: allowanceEarned,
      }, {
        // Must name the actual unique constraint: weekly_summaries is
        // unique(child_id, year, week_number). There is no unique index on
        // (child_id, week_start), so the previous target could never match.
        onConflict: 'child_id,year,week_number'
      })
      .select()
      .single()

    if (summaryError) throw summaryError

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error creating weekly summary:', error)
    return NextResponse.json({ error: 'Failed to create weekly summary' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    // No paid_at column exists on weekly_summaries — only is_paid. Nothing in
    // the UI ever sent paidAt, so writing it was silently dead.
    const { id, isPaid, notes, screenTimeUsed } = body

    if (!id) {
      return NextResponse.json({ error: 'Summary ID required' }, { status: 400 })
    }

    const updateData: TablesUpdate<'weekly_summaries'> = {}
    if (isPaid !== undefined) updateData.is_paid = isPaid
    if (notes !== undefined) updateData.notes = notes
    if (screenTimeUsed !== undefined) updateData.screen_time_used = screenTimeUsed

    const { data: summary, error } = await supabase
      .from('weekly_summaries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error updating weekly summary:', error)
    return NextResponse.json({ error: 'Failed to update weekly summary' }, { status: 500 })
  }
}
