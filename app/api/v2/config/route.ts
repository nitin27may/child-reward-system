import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
      return NextResponse.json({ error: 'No family found' }, { status: 400 })
    }

    // Get or create configuration
    const { data: config, error } = await supabase
      .from('configurations')
      .select('*')
      .eq('family_id', profile.family_id)
      .single()

    if (error && error.code === 'PGRST116') {
      // No config exists, create default
      const { data: newConfig, error: createError } = await supabase
        .from('configurations')
        .insert({
          family_id: profile.family_id,
          points_to_minutes: 5,
          points_to_dollars: 0.5,
          christmas_goal: 500,
          max_weekly_screen_time: 420,
        })
        .select()
        .single()

      if (createError) throw createError

      return NextResponse.json({
        pointsToMinutes: newConfig.points_to_minutes,
        pointsToDollars: newConfig.points_to_dollars,
        christmasGoal: newConfig.christmas_goal,
        maxWeeklyScreenTime: newConfig.max_weekly_screen_time,
      })
    }

    if (error) throw error

    return NextResponse.json({
      pointsToMinutes: config.points_to_minutes,
      pointsToDollars: config.points_to_dollars,
      christmasGoal: config.christmas_goal,
      maxWeeklyScreenTime: config.max_weekly_screen_time,
    })
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
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
    const { pointsToMinutes, pointsToDollars, christmasGoal, maxWeeklyScreenTime } = body

    // Get user's family_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', user.id)
      .single()

    if (!profile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (pointsToMinutes !== undefined) updateData.points_to_minutes = pointsToMinutes
    if (pointsToDollars !== undefined) updateData.points_to_dollars = pointsToDollars
    if (christmasGoal !== undefined) updateData.christmas_goal = christmasGoal
    if (maxWeeklyScreenTime !== undefined) updateData.max_weekly_screen_time = maxWeeklyScreenTime

    const { data: config, error } = await supabase
      .from('configurations')
      .update(updateData)
      .eq('family_id', profile.family_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      pointsToMinutes: config.points_to_minutes,
      pointsToDollars: config.points_to_dollars,
      christmasGoal: config.christmas_goal,
      maxWeeklyScreenTime: config.max_weekly_screen_time,
    })
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}
