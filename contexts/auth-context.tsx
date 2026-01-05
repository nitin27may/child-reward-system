'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Profile, Child, Family } from '@/types/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  family: Family | null
  children: Child[]
  selectedChild: Child | null
  setSelectedChild: (child: Child | null) => void
  loading: boolean
  isParent: boolean
  signOut: () => Promise<void>
  refreshData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [childrenList, setChildrenList] = useState<Child[]>([])
  const [selectedChild, setSelectedChildState] = useState<Child | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchUserData = async (currentUser: User) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      console.log('Profile fetch:', { profileData, profileError })
      setProfile(profileData)

      if (profileData?.family_id) {
        // Fetch family
        const { data: familyData, error: familyError } = await supabase
          .from('families')
          .select('*')
          .eq('id', profileData.family_id)
          .single()

        console.log('Family fetch:', { familyData, familyError })
        setFamily(familyData)

        // Fetch children
        const { data: childrenData, error: childrenError } = await supabase
          .from('children')
          .select('*')
          .eq('family_id', profileData.family_id)
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        console.log('Children fetch:', { childrenData, childrenError })
        setChildrenList(childrenData || [])

        // Set selected child from localStorage or first child
        const savedChildId = localStorage.getItem('selectedChildId')
        if (savedChildId && childrenData) {
          const savedChild = childrenData.find(c => c.id === savedChildId)
          if (savedChild) {
            setSelectedChildState(savedChild)
          } else if (childrenData.length > 0) {
            setSelectedChildState(childrenData[0])
          }
        } else if (childrenData && childrenData.length > 0) {
          setSelectedChildState(childrenData[0])
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const setSelectedChild = (child: Child | null) => {
    setSelectedChildState(child)
    if (child) {
      localStorage.setItem('selectedChildId', child.id)
    } else {
      localStorage.removeItem('selectedChildId')
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setFamily(null)
    setChildrenList([])
    setSelectedChildState(null)
    localStorage.removeItem('selectedChildId')
  }

  const refreshData = async () => {
    if (user) {
      await fetchUserData(user)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserData(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserData(session.user)
      } else {
        setProfile(null)
        setFamily(null)
        setChildrenList([])
        setSelectedChildState(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        family,
        children: childrenList,
        selectedChild,
        setSelectedChild,
        loading,
        isParent: profile?.role === 'parent',
        signOut,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
