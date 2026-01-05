'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  Calendar, Plus, Minus, Check, X, Zap, Gift, 
  TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Save
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface BonusEvent {
  type: 'bonus' | 'deduction'
  category: string
  points: number
  description?: string
}

interface TrackingData {
  date: Date
  healthNutrition: number
  screenDiscipline: number
  selfStudy: number
  household: number
  behaviorRespect: number
  dailyBonuses: number
  dailyDeductions: number
  notes: string
  bonusEvents: BonusEvent[]
}

const CATEGORIES = [
  { key: 'healthNutrition', label: 'Health & Nutrition', max: 3, icon: '🥗', color: 'emerald' },
  { key: 'screenDiscipline', label: 'Screen Discipline', max: 2, icon: '📱', color: 'blue' },
  { key: 'selfStudy', label: 'Self-Study & Learning', max: 2, icon: '📚', color: 'purple' },
  { key: 'household', label: 'Household Contribution', max: 3, icon: '🏠', color: 'amber' },
  { key: 'behaviorRespect', label: 'Behavior & Respect', max: 2, icon: '⭐', color: 'rose' },
]

const BONUS_PRESETS = [
  { label: 'Perfect sugar-free day', points: 2, icon: '🍏' },
  { label: 'Extraordinary helpfulness', points: 3, icon: '🦸' },
  { label: 'Homework ahead of schedule', points: 2, icon: '✅' },
  { label: 'Helped sibling/peer', points: 2, icon: '🤝' },
]

const DEDUCTION_PRESETS = [
  { label: 'Disrespectful behavior', points: -2, icon: '😤' },
  { label: 'Refused chore', points: -3, icon: '🚫' },
  { label: 'Lied about something', points: -5, icon: '🤥' },
  { label: 'Physical aggression', points: -5, icon: '👊' },
  { label: 'Sneaking screen time', points: -5, icon: '📵' },
  { label: 'Morning routine not completed', points: -1, icon: '⏰' },
  { label: 'Tantrum/meltdown', points: -3, icon: '😭' },
]

export default function TrackingPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [data, setData] = useState<TrackingData>({
    date: new Date(),
    healthNutrition: 0,
    screenDiscipline: 0,
    selfStudy: 0,
    household: 0,
    behaviorRespect: 0,
    dailyBonuses: 0,
    dailyDeductions: 0,
    notes: '',
    bonusEvents: [],
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchTracking()
  }, [selectedDate])

  const fetchTracking = async () => {
    try {
      const response = await fetch(`/api/tracking?date=${selectedDate}`)
      const tracking = await response.json()

      if (tracking && tracking.date) {
        setData({
          date: new Date(tracking.date),
          healthNutrition: tracking.healthNutrition ?? 0,
          screenDiscipline: tracking.screenDiscipline ?? 0,
          selfStudy: tracking.selfStudy ?? 0,
          household: tracking.household ?? 0,
          behaviorRespect: tracking.behaviorRespect ?? 0,
          dailyBonuses: tracking.dailyBonuses ?? 0,
          dailyDeductions: tracking.dailyDeductions ?? 0,
          notes: tracking.notes || '',
          bonusEvents: tracking.bonusEvents || [],
        })
      } else {
        setData({
          date: new Date(selectedDate),
          healthNutrition: 0,
          screenDiscipline: 0,
          selfStudy: 0,
          household: 0,
          behaviorRespect: 0,
          dailyBonuses: 0,
          dailyDeductions: 0,
          notes: '',
          bonusEvents: [],
        })
      }
    } catch (error) {
      console.error('Error fetching tracking:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          ...data,
        }),
      })

      if (response.ok) {
        setMessage('Saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save')
      }
    } catch (error) {
      console.error('Error saving:', error)
      setMessage('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const updateCategory = (key: string, value: number) => {
    setData({ ...data, [key]: Math.max(0, value) })
  }

  const addBonusEvent = (preset: { label: string; points: number }) => {
    const event: BonusEvent = {
      type: preset.points > 0 ? 'bonus' : 'deduction',
      category: preset.label,
      points: preset.points,
    }
    setData({
      ...data,
      bonusEvents: [...data.bonusEvents, event],
      dailyBonuses:
        preset.points > 0 ? data.dailyBonuses + preset.points : data.dailyBonuses,
      dailyDeductions:
        preset.points < 0 ? data.dailyDeductions + preset.points : data.dailyDeductions,
    })
  }

  const removeBonusEvent = (index: number) => {
    const event = data.bonusEvents[index]
    const newEvents = data.bonusEvents.filter((_, i) => i !== index)
    setData({
      ...data,
      bonusEvents: newEvents,
      dailyBonuses:
        event.type === 'bonus' ? data.dailyBonuses - event.points : data.dailyBonuses,
      dailyDeductions:
        event.type === 'deduction'
          ? data.dailyDeductions - event.points
          : data.dailyDeductions,
    })
  }

  const changeDate = (days: number) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + days)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const basePoints =
    (data.healthNutrition || 0) +
    (data.screenDiscipline || 0) +
    (data.selfStudy || 0) +
    (data.household || 0) +
    (data.behaviorRespect || 0)

  const totalPoints = basePoints + (data.dailyBonuses || 0) + (data.dailyDeductions || 0)

  const maxPossiblePoints = CATEGORIES.reduce((sum, cat) => sum + cat.max, 0)

  return (
    <div className="min-h-screen bg-slate-50 pt-14 lg:pt-0 pb-24 lg:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-14 lg:top-0 z-40">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 truncate">Daily Tracking</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 truncate">Record points for both reward tracks</p>
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm" className="h-9 px-3 sm:h-10 sm:px-4 flex-shrink-0">
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Progress'}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Date Selector */}
        <Card className="border-0 shadow-sm mb-4 sm:mb-6">
          <CardContent className="py-3 sm:py-4">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" onClick={() => changeDate(-1)} className="h-10 w-10 touch-manipulation">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto font-medium text-center border-0 bg-slate-50 focus:bg-white text-sm sm:text-base"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => changeDate(1)} className="h-10 w-10 touch-manipulation">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-center text-xs sm:text-sm text-slate-500 mt-2">
              {formatDate(new Date(selectedDate))}
            </p>
          </CardContent>
        </Card>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-center gap-2 text-sm ${
            message.includes('success') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.includes('success') ? <Check className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> : <X className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
            {message}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Categories */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="p-3 sm:p-6 pb-2">
                <CardTitle className="text-base sm:text-lg">Daily Categories</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Rate performance in each category (tap or use buttons)</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {CATEGORIES.map((category) => {
                    const value = (data as any)[category.key]
                    const percentage = (value / category.max) * 100
                    return (
                      <div
                        key={category.key}
                        className="p-3 sm:p-4 bg-slate-50 rounded-xl space-y-2 sm:space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl sm:text-2xl">{category.icon}</span>
                            <span className="font-medium text-slate-700 text-sm sm:text-base">{category.label}</span>
                          </div>
                          <span className="text-[10px] sm:text-xs text-slate-500 bg-white px-2 py-0.5 sm:py-1 rounded-full">
                            max {category.max}
                          </span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 progress-bar"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        
                        {/* Controls */}
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            onClick={() => updateCategory(category.key, value - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: category.max }, (_, i) => (
                              <button
                                key={i}
                                onClick={() => updateCategory(category.key, i + 1)}
                                className={`w-8 h-8 rounded-full transition-all ${
                                  i < value
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-white border-2 border-slate-200 hover:border-blue-300'
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            onClick={() => updateCategory(category.key, Math.min(value + 1, category.max))}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Bonuses & Deductions */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Bonuses
                  </CardTitle>
                  <CardDescription>Reward extra achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {BONUS_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => addBonusEvent(preset)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span>{preset.icon}</span>
                          <span className="text-sm text-slate-700">{preset.label}</span>
                        </div>
                        <span className="font-bold text-green-600">+{preset.points}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Deductions
                  </CardTitle>
                  <CardDescription>Record negative behaviors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {DEDUCTION_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => addBonusEvent(preset)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span>{preset.icon}</span>
                          <span className="text-sm text-slate-700">{preset.label}</span>
                        </div>
                        <span className="font-bold text-red-600">{preset.points}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Applied Events */}
            {data.bonusEvents.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Today&apos;s Events</CardTitle>
                  <CardDescription>Click to remove</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.bonusEvents.map((event, index) => (
                      <button
                        key={index}
                        onClick={() => removeBonusEvent(index)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-all hover:scale-105 ${
                          event.type === 'bonus'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <span>{event.category}</span>
                        <span className="font-bold">
                          {event.points > 0 ? '+' : ''}{event.points}
                        </span>
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Notes</CardTitle>
                <CardDescription>Any observations or comments about today</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData({ ...data, notes: e.target.value })}
                  placeholder="Add any notes about today..."
                  className="w-full min-h-24 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Points Summary */}
            <Card className="border-0 shadow-sm sticky top-24 lg:top-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Today&apos;s Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Total Points Circle */}
                <div className="relative mx-auto w-36 h-36">
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
                      stroke={totalPoints >= 0 ? "#3b82f6" : "#ef4444"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min(Math.abs(basePoints) / maxPossiblePoints * 100, 100) * 2.51} 251`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${totalPoints >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {totalPoints > 0 ? '+' : ''}{totalPoints}
                    </span>
                    <span className="text-xs text-slate-500">total points</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Base Points</span>
                    <span className="font-bold text-slate-900">{basePoints}/{maxPossiblePoints}</span>
                  </div>
                  
                  {data.dailyBonuses > 0 && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-700">Bonuses</span>
                      <span className="font-bold text-green-600">+{data.dailyBonuses}</span>
                    </div>
                  )}
                  
                  {data.dailyDeductions < 0 && (
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm text-red-700">Deductions</span>
                      <span className="font-bold text-red-600">{data.dailyDeductions}</span>
                    </div>
                  )}
                </div>

                {/* Track Distribution */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">Reward Tracks</h4>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-blue-600">Screen Time Track</p>
                      <p className="font-bold text-blue-700">{totalPoints} pts</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-emerald-600">Christmas Fund Track</p>
                      <p className="font-bold text-emerald-700">{totalPoints} pts</p>
                    </div>
                  </div>
                </div>

                {/* Save Button (Mobile) */}
                <Button onClick={handleSave} disabled={saving} className="w-full lg:hidden" size="lg">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Progress'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
