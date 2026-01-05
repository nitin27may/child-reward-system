'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts'
import { 
  Clock, Calendar as CalendarIcon, Save, ChevronLeft, ChevronRight, 
  Gift, Zap, TrendingUp, TrendingDown, Target, CheckCircle
} from 'lucide-react'
import { getWeekStartEnd, getWeekNumber, formatDate } from '@/lib/utils'

export default function WeeklyReviewPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [screenTimeUsed, setScreenTimeUsed] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [behaviorGoal, setBehaviorGoal] = useState<string>('')
  const [weekSummary, setWeekSummary] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    calculateWeekSummary()
  }, [selectedDate])

  const calculateWeekSummary = async () => {
    const date = new Date(selectedDate)
    const { start, end } = getWeekStartEnd(date)

    try {
      const response = await fetch(
        `/api/tracking?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      )
      const trackingData = await response.json()

      const totalScreenPoints = trackingData.reduce(
        (sum: number, day: any) => sum + day.screenTimeTotal,
        0
      )
      const christmasFundPoints = trackingData.reduce(
        (sum: number, day: any) => sum + day.christmasFundTotal,
        0
      )
      const totalBonuses = trackingData.reduce(
        (sum: number, day: any) => sum + day.dailyBonuses,
        0
      )
      const totalDeductions = trackingData.reduce(
        (sum: number, day: any) => sum + Math.abs(day.dailyDeductions),
        0
      )

      const configResponse = await fetch('/api/config')
      const config = await configResponse.json()

      const screenTimeEarned = Math.min(
        Math.floor(totalScreenPoints * config.pointsToMinutes),
        config.maxWeeklyScreenTime
      )

      const allTimeResponse = await fetch('/api/tracking')
      const allTimeData = await allTimeResponse.json()
      const christmasFundCumulative =
        allTimeData.reduce((sum: number, day: any) => sum + day.christmasFundTotal, 0) *
        config.pointsToDollars

      // Build daily chart data
      const dailyChartData = trackingData.map((day: any) => ({
        day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
        points: day.screenTimeTotal,
        bonuses: day.dailyBonuses,
        deductions: Math.abs(day.dailyDeductions),
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

      const weekNum = getWeekNumber(date)
      const year = date.getFullYear()
      const reviewResponse = await fetch(
        `/api/weekly?year=${year}&weekNumber=${weekNum}`
      )
      const existingReview = await reviewResponse.json()

      if (existingReview) {
        setScreenTimeUsed(existingReview.screenTimeUsed || screenTimeEarned)
        setNotes(existingReview.notes || '')
        setBehaviorGoal(existingReview.behaviorGoalNextWeek || '')
      }
    } catch (error) {
      console.error('Error calculating week summary:', error)
    }
  }

  const handleSave = async () => {
    if (!weekSummary) return

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          screenTimeUsed,
          notes,
          behaviorGoalNextWeek: behaviorGoal,
        }),
      })

      if (response.ok) {
        setMessage('Weekly review saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save weekly review')
      }
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

  return (
    <div className="min-h-screen bg-slate-50 pt-14 lg:pt-0 pb-24 lg:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-14 lg:top-0 z-40">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 truncate">Weekly Review</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 truncate">Complete your weekly review and set goals</p>
            </div>
            <Button onClick={handleSave} disabled={saving || !weekSummary} size="sm" className="h-9 px-3 sm:h-10 sm:px-4 flex-shrink-0">
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Review'}</span>
            </Button>
          </div>
        </div>
      </header>

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
                  {weekSummary.dailyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={weekSummary.dailyChartData} barGap={4}>
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
                        <Bar dataKey="points" fill="#3b82f6" name="Total Points" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-slate-500">
                      <p>No tracking data for this week</p>
                    </div>
                  )}
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
                    <div className="relative mx-auto w-36 h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900">{screenTimeUsagePercentage}%</span>
                        <span className="text-xs text-slate-500">used</span>
                      </div>
                    </div>

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
  )
}
