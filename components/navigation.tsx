'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Settings, BookOpen, Trophy, Menu, X, ChevronRight, Users, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ChildSelector } from '@/components/child-selector'

interface NavItem {
  href: string
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  parentOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', shortLabel: 'Home', icon: Home, description: 'Overview & stats' },
  { href: '/tracking', label: 'Daily Tracking', shortLabel: 'Track', icon: Calendar, description: 'Record daily points' },
  { href: '/weekly', label: 'Weekly Review', shortLabel: 'Weekly', icon: BookOpen, description: 'Weekly summaries' },
  { href: '/config', label: 'Settings', shortLabel: 'Settings', icon: Settings, description: 'System configuration', parentOnly: true },
  { href: '/children', label: 'Manage Children', shortLabel: 'Kids', icon: Users, description: 'Add or edit kids', parentOnly: true },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true)
    }
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Don't render navigation on auth pages
  if (pathname?.startsWith('/auth')) {
    return null
  }

  // Show loading or nothing while auth is loading
  if (loading) {
    return null
  }

  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item => {
    if (item.parentOnly && profile?.role !== 'parent') {
      return false
    }
    return true
  })

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">Reward Tracker</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Child Selector in Header */}
            <ChildSelector compact className="w-auto" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -mr-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-50 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
              {/* User Info */}
              {user && (
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      profile?.role === 'parent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    )}>
                      {profile?.role || 'user'}
                    </span>
                  </div>
                </div>
              )}

              <nav className="p-3 space-y-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] touch-manipulation',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        isActive ? 'bg-blue-100' : 'bg-slate-100'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                        <div className="text-xs text-slate-500 truncate">{item.description}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    </Link>
                  )
                })}

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] touch-manipulation text-red-600 hover:bg-red-50 active:bg-red-100"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium truncate">Sign Out</div>
                    <div className="text-xs text-red-400 truncate">Log out of account</div>
                  </div>
                </button>
              </nav>
            </div>
          </>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]",
        isStandalone && "pb-safe"
      )}>
        <div className="flex items-stretch justify-around h-16 px-1 max-w-md mx-auto">
          {filteredNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 transition-colors active:bg-slate-50 touch-manipulation',
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-400'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                  isActive && 'bg-blue-50'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  'text-[10px] mt-0.5',
                  isActive ? 'font-semibold' : 'font-medium'
                )}>{item.shortLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Reward Tracker</h1>
            <p className="text-xs text-slate-400">Dual Track System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 transition-transform group-hover:scale-110',
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'
                )} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className={cn(
                    'text-xs',
                    isActive ? 'text-blue-200' : 'text-slate-500'
                  )}>{item.description}</div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User & Sign Out */}
        <div className="px-4 py-4 border-t border-slate-700 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-200 truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
