'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area 
} from 'recharts'
import { 
  Trophy, TrendingUp, Calendar, DollarSign, Clock, Target, 
  Zap, Gift, ArrowUpRight, ArrowDownRight, Sparkles, Star
} from 'lucide-react'
import { getDaysUntilChristmas } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface DashboardData {
  currentWeek: {
    weekNumber: number
    year: number
    screenPoints: number
    screenTimeEarned: number
    daysUntilWeekend: number
    dailyData: any[]
  }
  christmasFund: {
    goal: number
    current: number
    points: number
    percentage: number
  }
  thisMonth: {
    screenPoints: number
    christmasFundPoints: number
    bonuses: number
    deductions: number
  }
  behaviorTrends: {
    commonDeductions: { category: string; count: number }[]
    commonBonuses: { category: string; count: number }[]
  }
  recentWeeks: any[]
  config: any
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 lg:pt-0">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data || !data.christmasFund) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 lg:pt-0">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome to Reward Tracker!</h2>
            <p className="text-slate-600 mb-6">Get started by setting up your reward system configuration.</p>
            <Link href="/config">
              <Button size="lg" className="w-full">
                <Zap className="mr-2 h-5 w-5" />
                Initialize System
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysUntilChristmas = getDaysUntilChristmas()
  const christmasProgress = Math.min(Math.max(data.christmasFund.percentage, 0), 100)

  const weeklyChartData = data.currentWeek.dailyData.map((day: any) => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    points: day.screenTimeTotal,
    bonuses: day.dailyBonuses,
    deductions: Math.abs(day.dailyDeductions),
  }))

  const recentWeeksData = data.recentWeeks.slice(0, 8).reverse().map((week: any) => ({
    week: `W${week.weekNumber}`,
    earned: week.screenTimeEarned,
    used: week.screenTimeUsed,
  }))

  const behaviorPieData = [
    { name: 'Bonuses', value: data.thisMonth.bonuses, fill: '#10b981' },
    { name: 'Deductions', value: data.thisMonth.deductions, fill: '#ef4444' },
  ].filter(item => item.value > 0)

  return (
    <div className="min-h-screen bg-slate-50 pt-14 lg:pt-0 pb-24 lg:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-14 lg:top-0 z-40">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 truncate">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Week {data.currentWeek.weekNumber}, {data.currentWeek.year}
              </p>
            </div>
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
          </div>
        </div>
      </header>

      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Screen Points */}
          <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">Screen Points</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1 stat-number">{data.currentWeek.screenPoints}</p>
                  <p className="text-blue-200 text-[10px] sm:text-xs mt-0.5 sm:mt-1">This week</p>
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
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1 stat-number">{data.currentWeek.screenTimeEarned}</p>
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
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1 stat-number">${data.christmasFund.current.toFixed(0)}</p>
                  <p className="text-emerald-200 text-[10px] sm:text-xs mt-0.5 sm:mt-1">of ${data.christmasFund.goal} goal</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Days Until Christmas */}
          <Card className="card-hover border-0 shadow-sm bg-gradient-to-br from-amber-500 to-orange-500 text-white">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-amber-100 text-xs sm:text-sm font-medium">Christmas</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1 stat-number">{daysUntilChristmas}</p>
                  <p className="text-amber-200 text-[10px] sm:text-xs mt-0.5 sm:mt-1">days to go</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5" />
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
                  <CardDescription className="text-xs sm:text-sm">Daily points breakdown</CardDescription>
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
              {weeklyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200} className="sm:!h-[280px]">
                  <AreaChart data={weeklyChartData}>
                    <defs>
                      <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="points"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPoints)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-slate-500">
                  <p>No data for this week yet. Start tracking!</p>
                </div>
              )}
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
                    <span className="text-3xl font-bold text-slate-900">{christmasProgress}%</span>
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
                    <p className="text-2xl font-bold text-slate-600">${(data.christmasFund.goal - data.christmasFund.current).toFixed(0)}</p>
                    <p className="text-xs text-slate-500">Remaining</p>
                  </div>
                </div>

                {data.christmasFund.current < 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                    <p className="text-sm text-red-700 font-medium">⚠️ In Debt - Earn points to recover!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="w-full sm:w-auto bg-white border border-slate-200 p-1 rounded-lg">
            <TabsTrigger value="monthly" className="rounded-md data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Monthly Stats
            </TabsTrigger>
            <TabsTrigger value="trends" className="rounded-md data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Behavior Trends
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-md data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="mt-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Screen Points</p>
                      <p className="text-2xl font-bold text-slate-900">{data.thisMonth.screenPoints}</p>
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
                      <p className="text-sm text-slate-500">Fund Points</p>
                      <p className="text-2xl font-bold text-slate-900">{data.thisMonth.christmasFundPoints}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <ArrowUpRight className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Bonuses</p>
                      <p className="text-2xl font-bold text-green-600">+{data.thisMonth.bonuses}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <ArrowDownRight className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Deductions</p>
                      <p className="text-2xl font-bold text-red-600">-{data.thisMonth.deductions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Pie Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Behavior Balance</CardTitle>
                  <CardDescription>Bonuses vs Deductions</CardDescription>
                </CardHeader>
                <CardContent>
                  {behaviorPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={behaviorPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {behaviorPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-slate-500">
                      <p>No behavior data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bonuses List */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                    Top Bonuses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.behaviorTrends.commonBonuses.length > 0 ? (
                    <div className="space-y-3">
                      {data.behaviorTrends.commonBonuses.map((bonus, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="text-sm text-slate-700">{bonus.category}</span>
                          <span className="font-bold text-green-600">{bonus.count}×</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No bonuses this month</p>
                  )}
                </CardContent>
              </Card>

              {/* Deductions List */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                    Common Deductions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.behaviorTrends.commonDeductions.length > 0 ? (
                    <div className="space-y-3">
                      {data.behaviorTrends.commonDeductions.map((deduction, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <span className="text-sm text-slate-700">{deduction.category}</span>
                          <span className="font-bold text-red-600">{deduction.count}×</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No deductions this month 🎉</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Screen Time History</CardTitle>
                <CardDescription>Earned vs Used across recent weeks</CardDescription>
              </CardHeader>
              <CardContent>
                {recentWeeksData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={recentWeeksData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="earned" fill="#3b82f6" name="Earned (min)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="used" fill="#8b5cf6" name="Used (min)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-500">
                    <p>Complete weekly reviews to see history</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
