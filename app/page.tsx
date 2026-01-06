'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/auth-context'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, DollarSign, Clock, 
  Zap, Gift, Sparkles,
  Users, LogIn, UserPlus, Loader2, Trophy
} from 'lucide-react'
import { getDaysUntilChristmas } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Dynamic imports for chart components to avoid Turbopack HMR issues
const WeeklyAreaChart = dynamic(
  () => import('@/components/charts').then(mod => mod.WeeklyAreaChart),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div> }
)
const HistoryBarChart = dynamic(
  () => import('@/components/charts').then(mod => mod.HistoryBarChart),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div> }
)

interface DashboardData {
  child: {
    id: string
    name: string
  }
  currentWeek: {
    weekStart: string
    weekEnd: string
    totalPoints: number
    screenTime: number
    maxScreenTime: number
    allowance: number
    daysTracked: number
    averageDaily: number
  }
  christmasFund: {
    current: number
    goal: number
    progress: number
  }
  thisMonth: {
    totalPoints: number
    screenTime: number
    allowance: number
  }
  behaviorTrends: {
    date: string
    points: number
    categories: Record<string, number>
  }[]
  recentWeeks: {
    weekStart: string
    weekEnd: string
    totalPoints: number
    screenTime: number
    allowance: number
    isPaid: boolean
  }[]
}

export default function DashboardPage() {
  const { user, loading: authLoading, selectedChild, children } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && selectedChild) {
      fetchDashboard()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [authLoading, selectedChild])

  const fetchDashboard = async () => {
    if (!selectedChild) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/v2/dashboard?childId=${selectedChild.id}`)
      const dashboardData = await response.json()
      if (dashboardData.error) {
        console.error('API Error:', dashboardData.error)
        setData(null)
      } else {
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 lg:pt-0">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in - this shouldn't show because layout handles redirect
  // But keep as fallback
  if (!user) {
    return null
  }

  // No children set up
  if (children.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 lg:pt-0 px-4">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Add Your Children</h2>
            <p className="text-slate-600 mb-6">Get started by adding children to track their rewards.</p>
            <Link href="/children">
              <Button size="lg" className="w-full">
                <UserPlus className="mr-2 h-5 w-5" />
                Add Children
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No child selected (shouldn't happen but just in case)
  if (!selectedChild) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 lg:pt-0 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-slate-600">Please select a child from the navigation.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No data yet
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 lg:pt-0 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Ready to Start!</h2>
            <p className="text-slate-600 mb-6">Begin tracking {selectedChild.name}'s daily behaviors.</p>
            <Link href="/tracking">
              <Button size="lg" className="w-full">
                <Calendar className="mr-2 h-5 w-5" />
                Start Tracking
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysUntilChristmas = getDaysUntilChristmas()
  const christmasProgress = Math.min(Math.max(data.christmasFund.progress, 0), 100)

  // Prepare chart data
  const weeklyChartData = data.behaviorTrends.slice(-7).map((day) => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    points: day.points,
  }))

  const recentWeeksData = data.recentWeeks.slice(0, 8).reverse().map((week) => {
    const weekNum = getWeekNumber(new Date(week.weekStart))
    return {
      week: `W${weekNum}`,
      earned: week.screenTime,
      allowance: week.allowance,
    }
  })

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  return (
    <>
      <PageHeader 
        title={`${data.child.name}'s Dashboard`}
        description={`Week of ${new Date(data.currentWeek.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
      />
      <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0">
        <div className="px-3 sm:px-6 lg:pl-6 lg:pr-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <Link href="/tracking">
              <Button size="sm" className="h-9 px-3 sm:h-10 sm:px-4">
                <Calendar className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Track Today</span>
              </Button>
            </Link>
            <Link href="/weekly" className="hidden sm:block">
              <Button variant="outline" size="sm" className="h-10 px-4">
                Weekly Review
              </Button>
            </Link>
          </div>
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Week Points */}
          <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">Week Points</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1">{data.currentWeek.totalPoints}</p>
                  <p className="text-blue-200 text-[10px] sm:text-xs mt-0.5 sm:mt-1">{data.currentWeek.daysTracked} days tracked</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Screen Time Earned */}
          <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-purple-100 text-xs sm:text-sm font-medium">Screen Time</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1">{data.currentWeek.screenTime}</p>
                  <p className="text-purple-200 text-[10px] sm:text-xs mt-0.5 sm:mt-1">minutes earned</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Christmas Fund */}
          <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-emerald-100 text-xs sm:text-sm font-medium">Christmas Fund</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1">${data.christmasFund.current.toFixed(0)}</p>
                  <p className="text-emerald-200 text-[10px] sm:text-xs mt-0.5 sm:mt-1">of ${data.christmasFund.goal} goal</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allowance */}
          <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-amber-100 text-xs sm:text-sm font-medium">Week Allowance</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1">${data.currentWeek.allowance.toFixed(2)}</p>
                  <p className="text-amber-200 text-[10px] sm:text-xs mt-0.5 sm:mt-1">earned so far</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Weekly Progress Chart */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="p-3 sm:p-6 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Weekly Progress</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Daily points this week</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500"></div>
                    Points
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <WeeklyAreaChart data={weeklyChartData} />
            </CardContent>
          </Card>

          {/* Christmas Fund Progress */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-600" />
                Christmas Fund
              </CardTitle>
              <CardDescription>{daysUntilChristmas} days until Christmas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Circular Progress */}
                <div className="relative mx-auto w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${christmasProgress * 2.51} 251`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900">{Math.round(christmasProgress)}%</span>
                    <span className="text-xs text-slate-500">complete</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">${data.christmasFund.current.toFixed(0)}</p>
                    <p className="text-xs text-slate-500">Saved</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-600">${Math.max(data.christmasFund.goal - data.christmasFund.current, 0).toFixed(0)}</p>
                    <p className="text-xs text-slate-500">Remaining</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Stats & History */}
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="w-full sm:w-auto bg-white border border-slate-200 p-1 rounded-lg">
            <TabsTrigger value="monthly" className="rounded-md data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              This Month
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-md data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Points</p>
                      <p className="text-2xl font-bold text-slate-900">{data.thisMonth.totalPoints}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Screen Time</p>
                      <p className="text-2xl font-bold text-slate-900">{data.thisMonth.screenTime} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Allowance</p>
                      <p className="text-2xl font-bold text-emerald-600">${data.thisMonth.allowance.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Weeks</CardTitle>
                <CardDescription>Screen time and allowance earned</CardDescription>
              </CardHeader>
              <CardContent>
                <HistoryBarChart data={recentWeeksData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </>
  )
}
