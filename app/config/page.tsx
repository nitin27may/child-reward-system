'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmojiPickerTrigger } from '@/components/emoji-picker'
import { 
  Settings, Plus, Trash2, Edit2, Save, X, Zap, Gift, 
  Clock, DollarSign, Target, CheckCircle, Sparkles
} from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center pt-14 lg:pt-0">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base sm:text-lg text-slate-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14 lg:pt-0 px-3 sm:px-4">
        <Card className="max-w-lg w-full border-0 shadow-lg">
          <CardHeader className="text-center pb-2 p-4 sm:p-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Initialize Reward System</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Set up your reward system with default categories and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">5 Default Categories</p>
                  <p className="text-sm text-slate-500">Health, Screen Discipline, Self-Study, Household, Behavior</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">5 Bonus Presets</p>
                  <p className="text-sm text-slate-500">Perfect day, Extra help, Homework ahead, and more</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">7 Deduction Presets</p>
                  <p className="text-sm text-slate-500">Disrespectful behavior, Refused chore, and more</p>
                </div>
              </div>
            </div>

            <Button onClick={handleInitialize} disabled={saving} size="lg" className="w-full">
              <Zap className="mr-2 h-5 w-5" />
              {saving ? 'Initializing...' : 'Initialize System'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-14 lg:pt-0 pb-24 lg:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-14 lg:top-0 z-40">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Configure your reward system</p>
          </div>
        </div>
      </header>

      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Success/Error Message */}
        {message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-center gap-2 text-sm ${
            message.includes('success') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.includes('success') ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> : <X className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
            {message}
          </div>
        )}

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full sm:w-auto bg-white border border-slate-200 p-1 rounded-lg mb-4 sm:mb-6 grid grid-cols-4 sm:flex gap-1">
            <TabsTrigger value="general" className="rounded-md text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              General
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-md text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Categories
            </TabsTrigger>
            <TabsTrigger value="bonuses" className="rounded-md text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Bonuses
            </TabsTrigger>
            <TabsTrigger value="deductions" className="rounded-md text-xs sm:text-sm px-2 sm:px-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Deductions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Screen Time Settings */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="p-3 sm:p-6 pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Screen Time Settings
                  </CardTitle>
                  <CardDescription>Configure screen time rewards</CardDescription>
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
                      onChange={(e) => setConfig({ ...config!, pointsToMinutes: parseFloat(e.target.value) })}
                      className="text-lg"
                    />
                    <p className="text-sm text-slate-500">
                      10 points = {(10 * (config?.pointsToMinutes ?? 0.5)).toFixed(1)} minutes of screen time
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxWeeklyScreenTime">Max Weekly Screen Time</Label>
                    <Input
                      id="maxWeeklyScreenTime"
                      type="number"
                      min="0"
                      value={config?.maxWeeklyScreenTime ?? 60}
                      onChange={(e) => setConfig({ ...config!, maxWeeklyScreenTime: parseInt(e.target.value) })}
                      className="text-lg"
                    />
                    <p className="text-sm text-slate-500">Maximum minutes earned per week</p>
                  </div>
                </CardContent>
              </Card>

              {/* Christmas Fund Settings */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5 text-emerald-600" />
                    Christmas Fund Settings
                  </CardTitle>
                  <CardDescription>Configure Christmas savings</CardDescription>
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
                      onChange={(e) => setConfig({ ...config!, pointsToDollars: parseFloat(e.target.value) })}
                      className="text-lg"
                    />
                    <p className="text-sm text-slate-500">
                      100 points = ${(100 * (config?.pointsToDollars ?? 1.0)).toFixed(2)}
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
                      className="text-lg"
                    />
                    <p className="text-sm text-slate-500">Target amount for Christmas 2025</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Button onClick={handleSaveConfig} disabled={saving} size="lg">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Point Categories</CardTitle>
                    <CardDescription>Daily earning categories</CardDescription>
                  </div>
                  <Button
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
                    <Plus className="h-4 w-4 mr-2" /> Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{category.icon}</span>
                        <div>
                          <div className="font-medium text-slate-900">{category.name}</div>
                          <div className="text-sm text-slate-500">Max: {category.maxPoints} pts</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingCategory(category)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {editingCategory && (
                  <div className="mt-6 p-6 border-2 border-blue-200 rounded-xl bg-blue-50">
                    <h3 className="font-semibold text-lg mb-4">
                      {editingCategory.id ? 'Edit Category' : 'New Category'}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          placeholder="e.g., Health & Nutrition"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Key (unique)</Label>
                        <Input
                          value={editingCategory.key}
                          onChange={(e) => setEditingCategory({ ...editingCategory, key: e.target.value })}
                          placeholder="e.g., healthNutrition"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon (emoji)</Label>
                        <EmojiPickerTrigger
                          value={editingCategory.icon}
                          onChange={(emoji) => setEditingCategory({ ...editingCategory, icon: emoji })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Points</Label>
                        <Input
                          type="number"
                          value={editingCategory.maxPoints}
                          onChange={(e) => setEditingCategory({ ...editingCategory, maxPoints: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={editingCategory.description || ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                          placeholder="Brief description"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => handleSaveCategory(editingCategory)}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingCategory(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bonuses">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Bonus Presets</CardTitle>
                    <CardDescription>Quick-add positive behaviors</CardDescription>
                  </div>
                  <Button
                    onClick={() => setEditingBonus({
                      id: 0,
                      label: '',
                      points: 2,
                      orderIndex: bonuses.length,
                      isActive: true,
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Bonus
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bonuses.map((bonus) => (
                    <div key={bonus.id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                      <div>
                        <div className="font-medium text-slate-900">{bonus.label}</div>
                        <div className="text-sm font-bold text-green-600">+{bonus.points} points</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingBonus(bonus)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBonus(bonus.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {editingBonus && (
                  <div className="mt-6 p-6 border-2 border-green-200 rounded-xl bg-green-50">
                    <h3 className="font-semibold text-lg mb-4">
                      {editingBonus.id ? 'Edit Bonus' : 'New Bonus'}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={editingBonus.label}
                          onChange={(e) => setEditingBonus({ ...editingBonus, label: e.target.value })}
                          placeholder="e.g., Perfect sugar-free day"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Points (positive)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editingBonus.points}
                          onChange={(e) => setEditingBonus({ ...editingBonus, points: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={editingBonus.description || ''}
                          onChange={(e) => setEditingBonus({ ...editingBonus, description: e.target.value })}
                          placeholder="Brief description"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => handleSaveBonus(editingBonus)}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingBonus(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deductions">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Deduction Presets</CardTitle>
                    <CardDescription>Quick-add negative behaviors</CardDescription>
                  </div>
                  <Button
                    onClick={() => setEditingDeduction({
                      id: 0,
                      label: '',
                      points: -2,
                      orderIndex: deductions.length,
                      isActive: true,
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Deduction
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deductions.map((deduction) => (
                    <div key={deduction.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                      <div>
                        <div className="font-medium text-slate-900">{deduction.label}</div>
                        <div className="text-sm font-bold text-red-600">{deduction.points} points</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingDeduction(deduction)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDeduction(deduction.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {editingDeduction && (
                  <div className="mt-6 p-6 border-2 border-red-200 rounded-xl bg-red-50">
                    <h3 className="font-semibold text-lg mb-4">
                      {editingDeduction.id ? 'Edit Deduction' : 'New Deduction'}
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={editingDeduction.label}
                          onChange={(e) => setEditingDeduction({ ...editingDeduction, label: e.target.value })}
                          placeholder="e.g., Disrespectful behavior"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Points (negative)</Label>
                        <Input
                          type="number"
                          max="-1"
                          value={editingDeduction.points}
                          onChange={(e) => setEditingDeduction({ ...editingDeduction, points: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={editingDeduction.description || ''}
                          onChange={(e) => setEditingDeduction({ ...editingDeduction, description: e.target.value })}
                          placeholder="Brief description"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => handleSaveDeduction(editingDeduction)}>
                        <Save className="h-4 w-4 mr-2" /> Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingDeduction(null)}>
                        Cancel
                      </Button>
                    </div>
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
