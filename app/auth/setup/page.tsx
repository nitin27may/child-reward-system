'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, Loader2, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const [familyName, setFamilyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Check if user already has a family
      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id, full_name')
        .eq('id', session.user.id)
        .single()

      if (profile?.family_id) {
        // Already set up, redirect to dashboard
        router.push('/')
        return
      }

      // Pre-fill family name suggestion
      const userName = profile?.full_name || session.user.user_metadata?.full_name || ''
      if (userName) {
        setFamilyName(`${userName}'s Family`)
      }

      setCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  const handleSetupFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setError('Session expired. Please sign in again.')
      setLoading(false)
      return
    }

    // Initialize family with the database function
    const { error: familyError } = await supabase.rpc('initialize_family', {
      family_name: familyName || 'My Family',
      user_id: session.user.id,
    })

    if (familyError) {
      console.error('Family creation error:', familyError)
      setError(`Failed to create family: ${familyError.message || 'Unknown error'}. Please try again.`)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    
    // Redirect after a moment
    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 1500)
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-slate-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Family Created!</h2>
            <p className="text-slate-600">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Set Up Your Family</CardTitle>
          <CardDescription>
            Create your family to start tracking rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetupFamily} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="familyName">Family Name</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="familyName"
                  type="text"
                  placeholder="The Smith Family"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">
                This will be displayed in your family dashboard
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Family...
                </>
              ) : (
                'Create Family'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
