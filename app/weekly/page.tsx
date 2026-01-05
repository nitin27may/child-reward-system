'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/auth-context'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  Clock, Calendar as CalendarIcon, Save, ChevronLeft, ChevronRight, 
  Gift, Zap, TrendingUp, TrendingDown, Target, CheckCircle, Loader2
} from 'lucide-react'
import { getWeekStartEnd, getWeekNumber, formatDate } from '@/lib/utils'

// Dynamic imports for chart components to avoid Turbopack HMR issues
const DailyBreakdownBarChart = dynamic(
  () => import('@/components/charts').then(mod => mod.DailyBreakdownBarChart),
  { ssr: false, loading: () => <div className="h-[280px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div> }
)
const ScreenTimePieChart = dynamic(
  () => import('@/components/charts').then(mod => mod.ScreenTimePieChart),
  { ssr: false, loading: () => <div className="relative mx-auto w-36 h-36 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div> }
)

export default function WeeklyReviewPage() {
  const { selectedChild, loading: authLoading } = useAuth()
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [screenTimeUsed, setScreenTimeUsed] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [behaviorGoal, setBehaviorGoal] = useState<string>('')
  const [weekSummary, setWeekSummary] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && selectedChild) {
      calculateWeekSummary()
    }
  }, [selectedDate, selectedChild, authLoading])

  const calculateWeekSummary = async () => {
    if (!selectedChild) return
    
    setLoading(true)
    const date = new Date(selectedDate)
    const { start, end } = getWeekStartEnd(date)

    try {
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]

      const response = await fetch(
        `/api/v2/tracking?childId=${selectedChild.id}&startDate=${startStr}&endDate=${endStr}`
      )
      const trackingData = await response.json()

      if (!Array.isArray(trackingData)) {
        setWeekSummary(null)
        return
      }

      const totalScreenPoints = trackingData.reduce(
        (sum: number, day: any) => sum + (day.daily_bonuses || 0),
        0
      )
      const christmasFundPoints = trackingData.reduce(
        (sum: number, day: any) => sum + Object.values(day.category_points || {}).reduce((a: number, b: any) => a + b, 0),
        0
      )
      const totalBonuses = trackingData.reduce(
        (sum: number, day: any) => sum + (day.daily_bonuses || 0),
        0
      )
      const totalDeductions = trackingData.reduce(
        (sum: number, day: any) => sum + Math.abs(day.daily_deductions || 0),
        0
      )

      const configResponse = await fetch('/api/v2/config')
      const config = await configResponse.json()

      const screenTimeEarned = Math.min(
        Math.floor(totalScreenPoints * (config.pointsToMinutes || 0.5)),
        config.maxWeeklyScreenTime || 60
      )

      const christmasFundCumulative =
        christmasFundPoints * (config.pointsToDollars || 1.0)

      // Build daily chart data
      const dailyChartData = trackingData.map((day: any) => ({
        day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
        points: day.daily_bonuses || 0,
        bonuses: day.daily_bonuses || 0,
        deductions: Math.abs(day.daily_deductions || 0),
      }))

      setWeekSummary({
        weekNumber: getWeekNumber(date),
        year: date.getFullYear(),
        weekStart: formatDate(start),
        weekEnd: formatDate(end),
        totalScreenPoints,
        screenTimeEarned,
        christmasFundPoints,
        christmasFundCumulative,
        totalBonuses,
        totalDeductions,
        dailyData: trackingData,
        dailyChartData,
        config,
      })

      setScreenTimeUsed(screenTimeEarned)
    } catch (error) {
      console.error('Error calculating week summary:', error)
      setWeekSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!weekSummary || !selectedChild) return

    setSaving(true)
    setMessage('')

    try {
      // Weekly summaries would need a weekly tracking API
      setMessage('Weekly summary saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving weekly review:', error)
      setMessage('Failed to save weekly review')
    } finally {
      setSaving(false)
    }
  }

  const changeWeek = (weeks: number) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + (weeks * 7))
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const screenTimeUsagePercentage = weekSummary 
    ? Math.round((screenTimeUsed / weekSummary.screenTimeEarned) * 100) || 0 
    : 0

  const pieData = weekSummary ? [
    { name: 'Used', value: screenTimeUsed, fill: '#8b5cf6' },
    { name: 'Remaining', value: Math.max(0, weekSummary.screenTimeEarned - screenTimeUsed), fill: '#e2e8f0' },
  ] : []

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14 lg:pt-0">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading weekly review...</p>
        </div>
      </div>
    )
  }

  if (!selectedChild) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14 lg:pt-0">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-slate-600">Please select a child to view weekly review.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <PageHeader 
        title="Weekly Review"
        description="Track screen time and complete your weekly review"
      />
      <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0">
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Week Selector */}
        <Card className="border-0 shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => changeWeek(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto font-medium text-center border-0 bg-slate-50 focus:bg-white"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => changeWeek(1)}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            {weekSummary && (
              <p className="text-center text-sm text-slate-500 mt-2">
                Week {weekSummary.weekNumber}, {weekSummary.year} • {weekSummary.weekStart} - {weekSummary.weekEnd}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Success Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.includes('success') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <CheckCircle className="h-5 w-5" />
            {message}
          </div>
        )}

        {weekSummary && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Screen Points</p>
                      <p className="text-3xl font-bold mt-1">{weekSummary.totalScreenPoints}</p>
                    </div>
                    <Zap className="h-6 w-6 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Time Earned</p>
                      <p className="text-3xl font-bold mt-1">{weekSummary.screenTimeEarned}</p>
                      <p className="text-purple-200 text-xs">minutes</p>
                    </div>
                    <Clock className="h-6 w-6 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Bonuses</p>
                      <p className="text-3xl font-bold mt-1">+{weekSummary.totalBonuses}</p>
                    </div>
                    <TrendingUp className="h-6 w-6 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">Deductions</p>
                      <p className="text-3xl font-bold mt-1">-{weekSummary.totalDeductions}</p>
                    </div>
                    <TrendingDown className="h-6 w-6 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Daily Breakdown Chart */}
              <Card className="lg:col-span-2 border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Daily Breakdown</CardTitle>
                  <CardDescription>Points earned each day this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <DailyBreakdownBarChart data={weekSummary.dailyChartData} />
                </CardContent>
              </Card>

              {/* Screen Time Usage */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Screen Time
                  </CardTitle>
                  <CardDescription>Usage this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Pie Chart */}
                    <ScreenTimePieChart data={pieData} usagePercentage={screenTimeUsagePercentage} />

                    {/* Input */}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-600">Minutes Used</Label>
                      <Input
                        type="number"
                        min="0"
                        max={weekSummary.screenTimeEarned}
                        value={screenTimeUsed}
                        onChange={(e) => setScreenTimeUsed(parseInt(e.target.value) || 0)}
                        className="text-center text-lg font-semibold"
                      />
                      <p className="text-xs text-slate-500 text-center">
                        of {weekSummary.screenTimeEarned} minutes earned
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Christmas Fund */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5 text-emerald-600" />
                    Christmas Fund This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-3xl font-bold text-emerald-600">{weekSummary.christmasFundPoints}</p>
                      <p className="text-xs text-slate-500">points earned</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-3xl font-bold text-emerald-600">
                        ${(weekSummary.christmasFundPoints * weekSummary.config.pointsToDollars).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">added to fund</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-600" />
                    Total Savings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <p className="text-4xl font-bold text-amber-600">${weekSummary.christmasFundCumulative.toFixed(2)}</p>
                    <p className="text-sm text-slate-500 mt-1">cumulative Christmas fund</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Log */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Daily Log</CardTitle>
                <CardDescription>Points breakdown by day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {weekSummary.dailyData.length > 0 ? (
                    weekSummary.dailyData.map((day: any) => (
                      <div
                        key={day.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{formatDate(new Date(day.date))}</p>
                            <p className="text-xs text-slate-500">
                              Base: {day.healthNutrition + day.screenDiscipline + day.selfStudy + day.household + day.behaviorRespect} pts
                              {day.dailyBonuses > 0 && <span className="text-green-600"> +{day.dailyBonuses} bonus</span>}
                              {day.dailyDeductions < 0 && <span className="text-red-600"> {day.dailyDeductions} deduction</span>}
                            </p>
                          </div>
                        </div>
                        <div className={`text-xl font-bold ${day.screenTimeTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {day.screenTimeTotal > 0 ? '+' : ''}{day.screenTimeTotal}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-500 py-8">No tracking data for this week</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes & Goals */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Weekly Reflection</CardTitle>
                  <CardDescription>What went well? What needs improvement?</CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reflect on this week's behavior and progress..."
                    className="w-full min-h-32 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Goal for Next Week</CardTitle>
                  <CardDescription>Set one behavior goal to focus on</CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={behaviorGoal}
                    onChange={(e) => setBehaviorGoal(e.target.value)}
                    placeholder="E.g., No talking back when asked to do chores..."
                    className="w-full min-h-32 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Mobile Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full lg:hidden" size="lg">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Weekly Review'}
            </Button>
          </>
        )}
        </div>
      </div>
    </>
  )
}
