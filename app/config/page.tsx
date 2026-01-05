'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Plus, Trash2, Edit2, Save, X } from 'lucide-react'

interface Config {
  id: number
  pointsToMinutes: number
  pointsToDollars: number
  christmasGoal: number
  maxWeeklyScreenTime: number
}

interface Category {
  id: number
  name: string
  key: string
  icon: string
  maxPoints: number
  orderIndex: number
  isActive: boolean
  description?: string
}

interface BonusPreset {
  id: number
  label: string
  points: number
  orderIndex: number
  isActive: boolean
  description?: string
}

interface DeductionPreset {
  id: number
  label: string
  points: number
  orderIndex: number
  isActive: boolean
  description?: string
}

export default function ConfigPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [bonuses, setBonuses] = useState<BonusPreset[]>([])
  const [deductions, setDeductions] = useState<DeductionPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingBonus, setEditingBonus] = useState<BonusPreset | null>(null)
  const [editingDeduction, setEditingDeduction] = useState<DeductionPreset | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      // Check if initialized
      const initResponse = await fetch('/api/initialize')
      const initData = await initResponse.json()
      setInitialized(initData.initialized)

      if (!initData.initialized) {
        setLoading(false)
        return
      }

      const [configRes, categoriesRes, bonusesRes, deductionsRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/categories'),
        fetch('/api/bonuses'),
        fetch('/api/deductions'),
      ])

      const [configData, categoriesData, bonusesData, deductionsData] = await Promise.all([
        configRes.json(),
        categoriesRes.json(),
        bonusesRes.json(),
        deductionsRes.json(),
      ])

      setConfig(configData)
      setCategories(categoriesData)
      setBonuses(bonusesData)
      setDeductions(deductionsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleInitialize = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/initialize', { method: 'POST' })
      const data = await response.json()
      if (response.ok) {
        setMessage('System initialized successfully!')
        await fetchAll()
      } else {
        setMessage(data.error || 'Failed to initialize')
      }
    } catch (error) {
      setMessage('Failed to initialize system')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveConfig = async () => {
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
      setMessage('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCategory = async (category: Category) => {
    try {
      const method = category.id ? 'PUT' : 'POST'
      const response = await fetch('/api/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      })

      if (response.ok) {
        await fetchAll()
        setEditingCategory(null)
        setMessage('Category saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('Failed to save category')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchAll()
        setMessage('Category deleted successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('Failed to delete category')
    }
  }

  const handleSaveBonus = async (bonus: BonusPreset) => {
    try {
      const method = bonus.id ? 'PUT' : 'POST'
      const response = await fetch('/api/bonuses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bonus),
      })

      if (response.ok) {
        await fetchAll()
        setEditingBonus(null)
        setMessage('Bonus saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('Failed to save bonus')
    }
  }

  const handleDeleteBonus = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bonus?')) return

    try {
      const response = await fetch(`/api/bonuses?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchAll()
        setMessage('Bonus deleted successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('Failed to delete bonus')
    }
  }

  const handleSaveDeduction = async (deduction: DeductionPreset) => {
    try {
      const method = deduction.id ? 'PUT' : 'POST'
      const response = await fetch('/api/deductions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deduction),
      })

      if (response.ok) {
        await fetchAll()
        setEditingDeduction(null)
        setMessage('Deduction saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('Failed to save deduction')
    }
  }

  const handleDeleteDeduction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this deduction?')) return

    try {
      const response = await fetch(`/api/deductions?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchAll()
        setMessage('Deduction deleted successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('Failed to delete deduction')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <p className="text-lg text-sky-600">Loading configuration...</p>
      </div>
    )
  }

  if (!initialized) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Initialize System</CardTitle>
            <CardDescription>
              The system needs to be initialized with default categories, bonuses, and deductions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              This will create:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-600 space-y-1">
              <li>5 default categories (Health, Screen Discipline, Self-Study, Household, Behavior)</li>
              <li>5 bonus presets (Perfect day, Extra help, etc.)</li>
              <li>7 deduction presets (Disrespectful behavior, Refused chore, etc.)</li>
              <li>Default configuration settings</li>
            </ul>
            <Button onClick={handleInitialize} disabled={saving} size="lg">
              {saving ? 'Initializing...' : 'Initialize System'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sky-900 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          System Configuration
        </h1>
        <p className="text-sky-700 mt-2">
          Configure all aspects of the reward system
        </p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
          <TabsTrigger value="deductions">Deductions</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
                <CardDescription>Configure how points convert to rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pointsToMinutes">Points to Minutes Ratio</Label>
                    <Input
                      id="pointsToMinutes"
                      type="number"
                      step="0.1"
                      min="0"
                      value={config?.pointsToMinutes ?? 0.5}
                      onChange={(e) => setConfig({ ...config!, pointsToMinutes: parseFloat(e.target.value) })}
                    />
                    <p className="text-sm text-gray-500">
                      Example: {config?.pointsToMinutes} min/point = 10 pts = {(10 * (config?.pointsToMinutes ?? 0.5)).toFixed(1)} minutes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxWeeklyScreenTime">Max Weekly Screen Time (min)</Label>
                    <Input
                      id="maxWeeklyScreenTime"
                      type="number"
                      min="0"
                      value={config?.maxWeeklyScreenTime ?? 60}
                      onChange={(e) => setConfig({ ...config!, maxWeeklyScreenTime: parseInt(e.target.value) })}
                    />
                    <p className="text-sm text-gray-500">Maximum minutes per week</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pointsToDollars">Points to Dollars Ratio</Label>
                    <Input
                      id="pointsToDollars"
                      type="number"
                      step="0.1"
                      min="0"
                      value={config?.pointsToDollars ?? 1.0}
                      onChange={(e) => setConfig({ ...config!, pointsToDollars: parseFloat(e.target.value) })}
                    />
                    <p className="text-sm text-gray-500">
                      Example: ${config?.pointsToDollars}/point = 100 pts = ${(100 * (config?.pointsToDollars ?? 1.0)).toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="christmasGoal">Christmas Goal ($)</Label>
                    <Input
                      id="christmasGoal"
                      type="number"
                      min="0"
                      value={config?.christmasGoal ?? 500}
                      onChange={(e) => setConfig({ ...config!, christmasGoal: parseFloat(e.target.value) })}
                    />
                    <p className="text-sm text-gray-500">Target amount for Christmas 2025</p>
                  </div>
                </div>

                <Button onClick={handleSaveConfig} disabled={saving}>
                  {saving ? 'Saving...' : 'Save General Settings'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Point Categories
                <Button
                  size="sm"
                  onClick={() => setEditingCategory({
                    id: 0,
                    name: '',
                    key: '',
                    icon: '⭐',
                    maxPoints: 3,
                    orderIndex: categories.length,
                    isActive: true,
                  })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Category
                </Button>
              </CardTitle>
              <CardDescription>
                Configure daily point categories (what can be earned each day)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-gray-500">Max: {category.maxPoints} points</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {editingCategory && (
                <div className="mt-6 p-4 border-2 border-sky-200 rounded-lg bg-sky-50">
                  <h3 className="font-semibold mb-4">
                    {editingCategory.id ? 'Edit Category' : 'New Category'}
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        placeholder="e.g., Health & Nutrition"
                      />
                    </div>
                    <div>
                      <Label>Key (unique identifier)</Label>
                      <Input
                        value={editingCategory.key}
                        onChange={(e) => setEditingCategory({ ...editingCategory, key: e.target.value })}
                        placeholder="e.g., healthNutrition"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Icon (emoji)</Label>
                        <Input
                          value={editingCategory.icon}
                          onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                          placeholder="🥗"
                        />
                      </div>
                      <div>
                        <Label>Max Points</Label>
                        <Input
                          type="number"
                          value={editingCategory.maxPoints}
                          onChange={(e) => setEditingCategory({ ...editingCategory, maxPoints: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={editingCategory.description || ''}
                        onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                        placeholder="Brief description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveCategory(editingCategory)}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingCategory(null)}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonuses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Bonus Presets
                <Button
                  size="sm"
                  onClick={() => setEditingBonus({
                    id: 0,
                    label: '',
                    points: 2,
                    orderIndex: bonuses.length,
                    isActive: true,
                  })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Bonus
                </Button>
              </CardTitle>
              <CardDescription>
                Quick-add bonus buttons for positive behaviors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bonuses.map((bonus) => (
                  <div key={bonus.id} className="flex items-center justify-between p-4 border rounded-lg border-green-200 bg-green-50">
                    <div>
                      <div className="font-medium">{bonus.label}</div>
                      <div className="text-sm text-green-700 font-semibold">+{bonus.points} points</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingBonus(bonus)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBonus(bonus.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {editingBonus && (
                <div className="mt-6 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <h3 className="font-semibold mb-4">
                    {editingBonus.id ? 'Edit Bonus' : 'New Bonus'}
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={editingBonus.label}
                        onChange={(e) => setEditingBonus({ ...editingBonus, label: e.target.value })}
                        placeholder="e.g., Perfect sugar-free day"
                      />
                    </div>
                    <div>
                      <Label>Points (positive)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editingBonus.points}
                        onChange={(e) => setEditingBonus({ ...editingBonus, points: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={editingBonus.description || ''}
                        onChange={(e) => setEditingBonus({ ...editingBonus, description: e.target.value })}
                        placeholder="Brief description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveBonus(editingBonus)}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingBonus(null)}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Deduction Presets
                <Button
                  size="sm"
                  onClick={() => setEditingDeduction({
                    id: 0,
                    label: '',
                    points: -2,
                    orderIndex: deductions.length,
                    isActive: true,
                  })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Deduction
                </Button>
              </CardTitle>
              <CardDescription>
                Quick-add deduction buttons for negative behaviors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deductions.map((deduction) => (
                  <div key={deduction.id} className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                    <div>
                      <div className="font-medium">{deduction.label}</div>
                      <div className="text-sm text-red-700 font-semibold">{deduction.points} points</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDeduction(deduction)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDeduction(deduction.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {editingDeduction && (
                <div className="mt-6 p-4 border-2 border-red-200 rounded-lg bg-red-50">
                  <h3 className="font-semibold mb-4">
                    {editingDeduction.id ? 'Edit Deduction' : 'New Deduction'}
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={editingDeduction.label}
                        onChange={(e) => setEditingDeduction({ ...editingDeduction, label: e.target.value })}
                        placeholder="e.g., Disrespectful behavior"
                      />
                    </div>
                    <div>
                      <Label>Points (negative)</Label>
                      <Input
                        type="number"
                        max="-1"
                        value={editingDeduction.points}
                        onChange={(e) => setEditingDeduction({ ...editingDeduction, points: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={editingDeduction.description || ''}
                        onChange={(e) => setEditingDeduction({ ...editingDeduction, description: e.target.value })}
                        placeholder="Brief description"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveDeduction(editingDeduction)}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingDeduction(null)}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
