'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Minus } from 'lucide-react'
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
  { key: 'healthNutrition', label: 'Health & Nutrition', max: 3, icon: '🥗' },
  { key: 'screenDiscipline', label: 'Screen Discipline', max: 2, icon: '📱' },
  { key: 'selfStudy', label: 'Self-Study & Learning', max: 2, icon: '📚' },
  { key: 'household', label: 'Household Contribution', max: 3, icon: '🏠' },
  { key: 'behaviorRespect', label: 'Behavior & Respect', max: 2, icon: '⭐' },
]

const BONUS_PRESETS = [
  { label: 'Perfect sugar-free day', points: 2 },
  { label: 'Extraordinary helpfulness', points: 3 },
  { label: 'Homework ahead of schedule', points: 2 },
  { label: 'Helped sibling/peer', points: 2 },
]

const DEDUCTION_PRESETS = [
  { label: 'Disrespectful behavior', points: -2 },
  { label: 'Refused chore', points: -3 },
  { label: 'Lied about something', points: -5 },
  { label: 'Physical aggression', points: -5 },
  { label: 'Sneaking screen time', points: -5 },
  { label: 'Morning routine not completed', points: -1 },
  { label: 'Tantrum/meltdown', points: -3 },
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

      if (tracking) {
        setData({
          date: new Date(tracking.date),
          healthNutrition: tracking.healthNutrition,
          screenDiscipline: tracking.screenDiscipline,
          selfStudy: tracking.selfStudy,
          household: tracking.household,
          behaviorRespect: tracking.behaviorRespect,
          dailyBonuses: tracking.dailyBonuses,
          dailyDeductions: tracking.dailyDeductions,
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

  const totalPoints =
    data.healthNutrition +
    data.screenDiscipline +
    data.selfStudy +
    data.household +
    data.behaviorRespect +
    data.dailyBonuses +
    data.dailyDeductions

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sky-900 flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Daily Tracking
        </h1>
        <p className="text-sky-700 mt-2">Record daily points for both tracks</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-sm text-gray-500 mt-2">
              {formatDate(new Date(selectedDate))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Base Categories</CardTitle>
            <CardDescription>Daily points (can be 0 or positive)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {CATEGORIES.map((category) => (
                <div key={category.key} className="space-y-2">
                  <Label className="text-base flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    {category.label}
                    <span className="text-sm text-gray-500">(0-{category.max})</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateCategory(
                          category.key,
                          (data as any)[category.key] - 1
                        )
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      max={category.max}
                      value={(data as any)[category.key]}
                      onChange={(e) =>
                        updateCategory(category.key, parseInt(e.target.value) || 0)
                      }
                      className="w-20 text-center text-lg font-semibold"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateCategory(
                          category.key,
                          Math.min((data as any)[category.key] + 1, category.max)
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Bonuses</CardTitle>
              <CardDescription>Add bonus points earned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {BONUS_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    onClick={() => addBonusEvent(preset)}
                    className="w-full justify-between"
                  >
                    <span>{preset.label}</span>
                    <span className="text-green-600 font-semibold">
                      +{preset.points}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deductions</CardTitle>
              <CardDescription>Add negative consequences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {DEDUCTION_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    onClick={() => addBonusEvent(preset)}
                    className="w-full justify-between"
                  >
                    <span>{preset.label}</span>
                    <span className="text-red-600 font-semibold">
                      {preset.points}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {data.bonusEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Applied Bonuses/Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.bonusEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{event.category}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          event.type === 'bonus' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {event.points > 0 ? '+' : ''}
                        {event.points}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBonusEvent(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              placeholder="Add any notes about today..."
              className="w-full min-h-24 p-3 border rounded-md"
            />
          </CardContent>
        </Card>

        <Card className="bg-sky-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Points Today</div>
                <div className={`text-4xl font-bold ${
                  totalPoints >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totalPoints > 0 ? '+' : ''}{totalPoints}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Screen Time Track</div>
                <div className="text-2xl font-bold text-sky-600">{totalPoints}</div>
                <div className="text-sm text-gray-600 mt-2">Christmas Fund Track</div>
                <div className="text-2xl font-bold text-cyan-600">{totalPoints}</div>
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
            {saving ? 'Saving...' : 'Save Daily Tracking'}
          </Button>
        </div>
      </div>
    </div>
  )
}
