'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

// Pages that don't require authentication
const PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/auth/callback', '/auth/setup']

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  
  const isAuthPage = pathname?.startsWith('/auth')
  const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path))

  useEffect(() => {
    // Redirect to login if not authenticated and not on a public page
    if (!loading && !user && !isPublicPath) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname || '/')}`)
    }
  }, [user, loading, isPublicPath, pathname, router])

  // Auth pages render without navigation/sidebar
  if (isAuthPage) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    )
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and not on public page, show loading (redirect happening)
  if (!user && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Regular pages with navigation
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-0">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
