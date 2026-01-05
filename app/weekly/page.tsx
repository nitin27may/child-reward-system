'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Clock, Calendar as CalendarIcon } from 'lucide-react'
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

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sky-900 flex items-center gap-2">
          <CalendarIcon className="h-8 w-8" />
          Weekly Review
        </h1>
        <p className="text-sky-700 mt-2">
          Complete your weekly review and set goals for next week
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Week</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
            {weekSummary && (
              <p className="text-sm text-gray-500 mt-2">
                Week {weekSummary.weekNumber}, {weekSummary.year} ({weekSummary.weekStart} - {weekSummary.weekEnd})
              </p>
            )}
          </CardContent>
        </Card>

        {weekSummary && (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-sky-200">
                <CardHeader className="bg-gradient-to-r from-sky-50 to-cyan-50">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-sky-600" />
                    Screen Time Track
                  </CardTitle>
                  <CardDescription>This week's screen time summary</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-sky-50 rounded-lg">
                      <span className="text-sm text-gray-600">Total Points</span>
                      <span className="text-2xl font-bold text-sky-600">
                        {weekSummary.totalScreenPoints}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
                      <span className="text-sm text-gray-600">Screen Time Earned</span>
                      <span className="text-2xl font-bold text-cyan-600">
                        {weekSummary.screenTimeEarned} min
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-600">Conversion Rate</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {weekSummary.config.pointsToMinutes} min/point
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-cyan-200">
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-sky-50">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    Christmas Fund Track
                  </CardTitle>
                  <CardDescription>This week's fund contribution</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
                      <span className="text-sm text-gray-600">Points This Week</span>
                      <span className="text-2xl font-bold text-cyan-600">
                        {weekSummary.christmasFundPoints}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-sky-50 rounded-lg">
                      <span className="text-sm text-gray-600">Cumulative Total</span>
                      <span className="text-2xl font-bold text-sky-600">
                        ${weekSummary.christmasFundCumulative.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-600">Conversion Rate</span>
                      <span className="text-sm font-semibold text-blue-600">
                        ${weekSummary.config.pointsToDollars}/point
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Behavior Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-6 border rounded-lg border-green-200">
                    <div className="text-sm text-gray-600 mb-2">Total Bonuses</div>
                    <div className="text-4xl font-bold text-green-600">
                      +{weekSummary.totalBonuses}
                    </div>
                  </div>
                  <div className="text-center p-6 border rounded-lg border-red-200">
                    <div className="text-sm text-gray-600 mb-2">Total Deductions</div>
                    <div className="text-4xl font-bold text-red-600">
                      -{weekSummary.totalDeductions}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {weekSummary.dailyData.map((day: any) => (
                    <div
                      key={day.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <span className="font-medium">
                        {formatDate(new Date(day.date))}
                      </span>
                      <div className="flex gap-4">
                        <span className={`font-semibold ${
                          day.screenTimeTotal >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {day.screenTimeTotal > 0 ? '+' : ''}{day.screenTimeTotal} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Screen Time Usage</CardTitle>
                <CardDescription>
                  How many minutes of screen time were actually used?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="screenTimeUsed">Minutes Used</Label>
                  <Input
                    id="screenTimeUsed"
                    type="number"
                    min="0"
                    max={weekSummary.screenTimeEarned}
                    value={screenTimeUsed}
                    onChange={(e) => setScreenTimeUsed(parseInt(e.target.value) || 0)}
                    className="max-w-xs"
                  />
                  <p className="text-sm text-gray-500">
                    Out of {weekSummary.screenTimeEarned} minutes earned
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Review Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">What went well? What needs improvement?</Label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Reflections on this week's behavior and progress..."
                      className="w-full min-h-32 p-3 border rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="behaviorGoal">Behavior Goal for Next Week</Label>
                    <Input
                      id="behaviorGoal"
                      value={behaviorGoal}
                      onChange={(e) => setBehaviorGoal(e.target.value)}
                      placeholder="E.g., No talking back when asked to do chores"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div>
                {message && (
                  <p
                    className={`text-sm ${
                      message.includes('success') ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {message}
                  </p>
                )}
              </div>
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? 'Saving...' : 'Save Weekly Review'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
