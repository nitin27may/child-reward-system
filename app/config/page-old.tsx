'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

interface Config {
  id: number
  pointsToMinutes: number
  pointsToDollars: number
  christmasGoal: number
  maxWeeklyScreenTime: number
}

export default function ConfigPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config')
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('Error fetching config:', error)
      setMessage('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setMessage('Configuration saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      setMessage('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (field: keyof Config, value: number) => {
    if (config) {
      setConfig({ ...config, [field]: value })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <p className="text-lg text-sky-600">Loading configuration...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sky-900 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          System Configuration
        </h1>
        <p className="text-sky-700 mt-2">
          Configure conversion rates and system settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Screen Time Conversion</CardTitle>
            <CardDescription>
              Configure how points convert to screen time minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pointsToMinutes">Points to Minutes Ratio</Label>
              <Input
                id="pointsToMinutes"
                type="number"
                step="0.1"
                min="0"
                value={config?.pointsToMinutes ?? 0.5}
                onChange={(e) =>
                  updateConfig('pointsToMinutes', parseFloat(e.target.value))
                }
              />
              <p className="text-sm text-gray-500">
                Current: {config?.pointsToMinutes} minutes per point
                <br />
                Example: 10 points = {(10 * (config?.pointsToMinutes ?? 0.5)).toFixed(1)} minutes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxWeeklyScreenTime">Maximum Weekly Screen Time (minutes)</Label>
              <Input
                id="maxWeeklyScreenTime"
                type="number"
                min="0"
                value={config?.maxWeeklyScreenTime ?? 60}
                onChange={(e) =>
                  updateConfig('maxWeeklyScreenTime', parseInt(e.target.value))
                }
              />
              <p className="text-sm text-gray-500">
                Maximum screen time that can be earned per week
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Christmas Fund Conversion</CardTitle>
            <CardDescription>
              Configure how points convert to money
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pointsToDollars">Points to Dollars Ratio</Label>
              <Input
                id="pointsToDollars"
                type="number"
                step="0.1"
                min="0"
                value={config?.pointsToDollars ?? 1.0}
                onChange={(e) =>
                  updateConfig('pointsToDollars', parseFloat(e.target.value))
                }
              />
              <p className="text-sm text-gray-500">
                Current: ${config?.pointsToDollars} per point
                <br />
                Example: 100 points = ${(100 * (config?.pointsToDollars ?? 1.0)).toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="christmasGoal">Christmas Goal ($)</Label>
              <Input
                id="christmasGoal"
                type="number"
                min="0"
                value={config?.christmasGoal ?? 500}
                onChange={(e) =>
                  updateConfig('christmasGoal', parseFloat(e.target.value))
                }
              />
              <p className="text-sm text-gray-500">
                Target amount to earn by Christmas 2025
              </p>
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchConfig} disabled={saving}>
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
