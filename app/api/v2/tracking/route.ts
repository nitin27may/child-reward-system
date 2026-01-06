import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getWeekStartEnd(dateStr: string) {
  // Parse the date string as a local date
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

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId')
  const date = searchParams.get('date')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const recent = searchParams.get('recent')

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

    // Single date query
    if (date) {
      const { data: tracking, error } = await supabase
        .from('daily_tracking')
        .select('*, bonus_events(*)')
        .eq('child_id', childId)
        .eq('date', date)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return NextResponse.json(tracking || null)
    }

    // Date range query
    if (startDate && endDate) {
      const { data: trackings, error } = await supabase
        .from('daily_tracking')
        .select('*, bonus_events(*)')
        .eq('child_id', childId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) throw error

      return NextResponse.json(trackings)
    }

    // Recent tracking (last 7 days)
    if (recent) {
      const today = new Date().toISOString().split('T')[0]
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const startStr = sevenDaysAgo.toISOString().split('T')[0]

      const { data: trackings, error } = await supabase
        .from('daily_tracking')
        .select('*, bonus_events(*)')
        .eq('child_id', childId)
        .gte('date', startStr)
        .lte('date', today)
        .order('date', { ascending: false })

      if (error) throw error

      return NextResponse.json(trackings)
    }

    return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching tracking:', error)
    return NextResponse.json({ error: 'Failed to fetch tracking' }, { status: 500 })
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
    const { 
      childId, 
      date, 
      category_points,
      daily_bonuses,
      daily_deductions,
      screen_time_used,
      notes,
      bonus_events 
    } = body

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

    // Calculate day_of_week (0 = Sunday, 6 = Saturday)
    const dateObj = new Date(date + 'T00:00:00')
    const dayOfWeek = dateObj.getDay()

    // Calculate total points from category_points
    const categoryPointsSum = Object.values(category_points || {}).reduce((sum: number, val) => sum + (Number(val) || 0), 0)
    const totalPoints = categoryPointsSum + (daily_bonuses || 0) + (daily_deductions || 0)

    // Upsert daily tracking
    const { data: tracking, error: trackingError } = await supabase
      .from('daily_tracking')
      .upsert({
        child_id: childId,
        date,
        day_of_week: dayOfWeek,
        category_points: category_points || {},
        daily_bonuses: daily_bonuses || 0,
        daily_deductions: daily_deductions || 0,
        total_points: totalPoints,
        screen_time_used: screen_time_used || 0,
        notes: notes || null,
      }, {
        onConflict: 'child_id,date'
      })
      .select()
      .single()

    if (trackingError) throw trackingError

    // Handle bonus_events: store in bonus_events table
    if (bonus_events && Array.isArray(bonus_events) && bonus_events.length > 0) {
      // Delete existing bonus events for this tracking
      await supabase
        .from('bonus_events')
        .delete()
        .eq('daily_tracking_id', tracking.id)

      // Insert new bonus events
      const events = bonus_events.map((evt: { type: string; category: string; points: number; description?: string }) => ({
        daily_tracking_id: tracking.id,
        type: evt.type,
        category: evt.category,
        points: evt.points,
        description: evt.description || null,
      }))

      await supabase.from('bonus_events').insert(events)
    }

    // Fetch with bonus_events
    const { data: result } = await supabase
      .from('daily_tracking')
      .select('*, bonus_events(*)')
      .eq('id', tracking.id)
      .single()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error saving tracking:', error)
    return NextResponse.json({ error: 'Failed to save tracking' }, { status: 500 })
  }
}
