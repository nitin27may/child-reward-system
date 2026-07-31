import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { TablesUpdate } from '@/types/supabase'

export async function GET(request: NextRequest) {
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
      return NextResponse.json([])
    }

    const { data: children, error } = await supabase
      .from('children')
      .select('*')
      .eq('family_id', profile.family_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(children || [])
  } catch (error) {
    console.error('Error fetching children:', error)
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
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
    const { name, dateOfBirth, avatarUrl, avatar_color, canViewDashboard, email } = body

    // Get user's family_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', user.id)
      .single()

    if (!profile?.family_id) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 })
    }

    const { data: child, error } = await supabase
      .from('children')
      .insert({
        family_id: profile.family_id,
        name,
        email: email || null,
        date_of_birth: dateOfBirth || null,
        avatar_url: avatarUrl || null,
        avatar_color: avatar_color || '#3b82f6',
        can_view_dashboard: canViewDashboard || false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(child)
  } catch (error) {
    console.error('Error creating child:', error)
    return NextResponse.json({ error: 'Failed to create child' }, { status: 500 })
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
    const { id, name, dateOfBirth, avatarUrl, avatar_color, canViewDashboard, can_view_dashboard, isActive, email } = body

    const updateData: TablesUpdate<'children'> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl
    if (avatar_color !== undefined) updateData.avatar_color = avatar_color
    if (canViewDashboard !== undefined) updateData.can_view_dashboard = canViewDashboard
    if (can_view_dashboard !== undefined) updateData.can_view_dashboard = can_view_dashboard
    if (isActive !== undefined) updateData.is_active = isActive

    const { data: child, error } = await supabase
      .from('children')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(child)
  } catch (error) {
    console.error('Error updating child:', error)
    return NextResponse.json({ error: 'Failed to update child' }, { status: 500 })
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
      return NextResponse.json({ error: 'Child ID required' }, { status: 400 })
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('children')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting child:', error)
    return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 })
  }
}
