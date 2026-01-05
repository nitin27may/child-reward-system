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

    const { data: bonuses, error } = await supabase
      .from('bonus_presets')
      .select('*')
      .eq('family_id', profile.family_id)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) throw error

    // Map to frontend format
    const mapped = (bonuses || []).map(b => ({
      id: b.id,
      label: b.label,
      points: b.points,
      icon: b.icon,
      description: b.description,
      isActive: b.is_active,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Error fetching bonuses:', error)
    return NextResponse.json({ error: 'Failed to fetch bonuses' }, { status: 500 })
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
    const { name, points, description } = body

    // Get user's family_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', user.id)
      .single()

    if (!profile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 })
    }

    const { data: bonus, error } = await supabase
      .from('bonus_presets')
      .insert({
        family_id: profile.family_id,
        label: name,
        points: points || 1,
        description: description || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      id: bonus.id,
      name: bonus.label,
      points: bonus.points,
      description: bonus.description,
      isActive: bonus.is_active,
    })
  } catch (error) {
    console.error('Error creating bonus:', error)
    return NextResponse.json({ error: 'Failed to create bonus' }, { status: 500 })
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
    const { id, name, points, description, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Bonus ID required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.label = name
    if (points !== undefined) updateData.points = points
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.is_active = isActive

    const { data: bonus, error } = await supabase
      .from('bonus_presets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      id: bonus.id,
      name: bonus.label,
      points: bonus.points,
      description: bonus.description,
      isActive: bonus.is_active,
    })
  } catch (error) {
    console.error('Error updating bonus:', error)
    return NextResponse.json({ error: 'Failed to update bonus' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Bonus ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('bonus_presets')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bonus:', error)
    return NextResponse.json({ error: 'Failed to delete bonus' }, { status: 500 })
  }
}
