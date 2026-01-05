'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Trophy, TrendingUp, Calendar, DollarSign, Clock, Target } from 'lucide-react'
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
      setData(dashboardData)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <p className="text-lg text-sky-600">Loading dashboard...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-600">Failed to load dashboard</p>
      </div>
    )
  }

  const daysUntilChristmas = getDaysUntilChristmas()
  const christmasProgress = data.christmasFund.percentage

  const weeklyChartData = data.currentWeek.dailyData.map((day: any) => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    points: day.screenTimeTotal,
  }))

  const recentWeeksData = data.recentWeeks.slice(0, 8).reverse().map((week: any) => ({
    week: `W${week.weekNumber}`,
    earned: week.screenTimeEarned,
    used: week.screenTimeUsed,
  }))

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-sky-900 flex items-center gap-3">
          <Trophy className="h-10 w-10 text-sky-500" />
          Reward Dashboard
        </h1>
        <p className="text-sky-700 mt-2 text-lg">Track your progress on both reward tracks</p>
      </div>

      <div className="grid gap-6">
        {/* Quick Actions */}
        <div className="flex gap-4">
          <Link href="/tracking" className="flex-1">
            <Button className="w-full h-20 text-lg" size="lg">
              <Calendar className="mr-2 h-6 w-6" />
              Add Daily Tracking
            </Button>
          </Link>
          <Link href="/config" className="flex-1">
            <Button variant="outline" className="w-full h-20 text-lg" size="lg">
              Configure System
            </Button>
          </Link>
        </div>

        {/* Current Week Screen Time */}
        <Card className="border-sky-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-cyan-50">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="h-6 w-6 text-sky-600" />
              This Week&apos;s Screen Time
            </CardTitle>
            <CardDescription className="text-base">
              Week {data.currentWeek.weekNumber}, {data.currentWeek.year}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Screen Points</div>
                <div className="text-4xl font-bold text-sky-600">
                  {data.currentWeek.screenPoints}
                </div>
                <div className="text-xs text-gray-500 mt-1">points earned</div>
              </div>
              <div className="text-center p-4 bg-cyan-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Screen Time Earned</div>
                <div className="text-4xl font-bold text-cyan-600">
                  {data.currentWeek.screenTimeEarned}
                </div>
                <div className="text-xs text-gray-500 mt-1">minutes</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Days Until Weekend</div>
                <div className="text-4xl font-bold text-blue-600">
                  {data.currentWeek.daysUntilWeekend}
                </div>
                <div className="text-xs text-gray-500 mt-1">days remaining</div>
              </div>
            </div>

            {weeklyChartData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Daily Progress This Week</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="day" stroke="#0c4a6e" />
                    <YAxis stroke="#0c4a6e" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #0ea5e9',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="points" fill="#0ea5e9" radius={[8, 8, 0, 0]}>
                      {weeklyChartData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.points < 0 ? '#ef4444' : '#0ea5e9'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Christmas Fund */}
        <Card className="border-cyan-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-sky-50">
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-cyan-600" />
              Christmas Fund 2025
            </CardTitle>
            <CardDescription className="text-base">
              {daysUntilChristmas} days until Christmas
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="text-center p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Current Amount</div>
                <div className="text-5xl font-bold text-cyan-600">
                  ${data.christmasFund.current.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {data.christmasFund.points} points
                </div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Goal</div>
                <div className="text-5xl font-bold text-sky-600">
                  ${data.christmasFund.goal.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  ${(data.christmasFund.goal - data.christmasFund.current).toFixed(2)} remaining
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress to Goal</span>
                <span className="font-semibold">{christmasProgress}%</span>
              </div>
              <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    data.christmasFund.current < 0
                      ? 'bg-red-500'
                      : 'bg-gradient-to-r from-cyan-500 to-sky-500'
                  }`}
                  style={{
                    width: `${Math.min(Math.max(christmasProgress, 0), 100)}%`,
                  }}
                />
              </div>
              {data.christmasFund.current < 0 && (
                <p className="text-sm text-red-600 font-semibold text-center mt-2">
                  In Debt: Must earn back to positive!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
            <TabsTrigger value="trends">Behavior Trends</TabsTrigger>
            <TabsTrigger value="history">Weekly History</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  This Month&apos;s Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Screen Points</div>
                    <div className="text-3xl font-bold text-sky-600">
                      {data.thisMonth.screenPoints}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-gray-600">Christmas Fund</div>
                    <div className="text-3xl font-bold text-cyan-600">
                      {data.thisMonth.christmasFundPoints}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg border-green-200">
                    <div className="text-sm text-gray-600">Bonuses</div>
                    <div className="text-3xl font-bold text-green-600">
                      +{data.thisMonth.bonuses}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg border-red-200">
                    <div className="text-sm text-gray-600">Deductions</div>
                    <div className="text-3xl font-bold text-red-600">
                      -{data.thisMonth.deductions}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Behavior Analysis
                </CardTitle>
                <CardDescription>Identify strengths and areas for improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-green-700 mb-4">Top Bonuses Earned</h3>
                    {data.behaviorTrends.commonBonuses.length > 0 ? (
                      <div className="space-y-2">
                        {data.behaviorTrends.commonBonuses.map((bonus, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                          >
                            <span className="text-sm">{bonus.category}</span>
                            <span className="font-bold text-green-600">{bonus.count}×</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No bonuses recorded this month</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-700 mb-4">Common Deductions</h3>
                    {data.behaviorTrends.commonDeductions.length > 0 ? (
                      <div className="space-y-2">
                        {data.behaviorTrends.commonDeductions.map((deduction, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                          >
                            <span className="text-sm">{deduction.category}</span>
                            <span className="font-bold text-red-600">{deduction.count}×</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No deductions recorded this month
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Screen Time History</CardTitle>
                <CardDescription>Compare earned vs. used screen time</CardDescription>
              </CardHeader>
              <CardContent>
                {recentWeeksData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={recentWeeksData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                      <XAxis dataKey="week" stroke="#0c4a6e" />
                      <YAxis stroke="#0c4a6e" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#f0f9ff',
                          border: '1px solid #0ea5e9',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="earned"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        name="Earned (min)"
                      />
                      <Line
                        type="monotone"
                        dataKey="used"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        name="Used (min)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No weekly review data yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
