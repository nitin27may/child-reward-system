'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  User, 
  Save, 
  X,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  UserPlus,
  Mail,
  Info
} from 'lucide-react'

interface Child {
  id: string
  name: string
  email: string | null
  avatar_color: string
  can_view_dashboard: boolean
  created_at: string
}

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#0ea5e9'
]

export default function ChildrenPage() {
  const { profile, refreshData, loading: authLoading } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', avatar_color: AVATAR_COLORS[0] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Only fetch when auth is loaded and user has a profile
    if (!authLoading && profile) {
      fetchChildren()
    } else if (!authLoading && !profile) {
      setLoading(false)
    }
  }, [authLoading, profile])

  const fetchChildren = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/children')
      if (res.status === 401) {
        // Not authenticated, don't show error - will redirect via auth context
        setChildren([])
        return
      }
      if (!res.ok) throw new Error('Failed to fetch children')
      const data = await res.json()
      setChildren(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load children')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ name: '', email: '', avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] })
  }

  const handleEdit = (child: Child) => {
    setEditingId(child.id)
    setIsAdding(false)
    setFormData({ name: child.name, email: child.email || '', avatar_color: child.avatar_color })
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ name: '', email: '', avatar_color: AVATAR_COLORS[0] })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return

    setSaving(true)
    try {
      if (isAdding) {
        const res = await fetch('/api/children', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to add child')
      } else if (editingId) {
        const res = await fetch('/api/children', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...formData })
        })
        if (!res.ok) throw new Error('Failed to update child')
      }
      
      await fetchChildren()
      await refreshData()
      handleCancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleDashboard = async (child: Child) => {
    try {
      const res = await fetch('/api/children', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: child.id, 
          can_view_dashboard: !child.can_view_dashboard 
        })
      })
      if (!res.ok) throw new Error('Failed to update')
      await fetchChildren()
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this child? Their data will be preserved but hidden.')) {
      return
    }

    try {
      const res = await fetch(`/api/children?id=${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchChildren()
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  if (profile?.role !== 'parent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-amber-700">
                <AlertCircle className="w-5 h-5" />
                <p>Only parents can manage children.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manage Children</h1>
            <p className="text-slate-500">Add and manage kids in your family</p>
          </div>
          {!isAdding && !editingId && (
            <Button onClick={handleAdd} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Child
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <Card>
            <CardHeader>
              <CardTitle>{isAdding ? 'Add New Child' : 'Edit Child'}</CardTitle>
              <CardDescription>
                {isAdding ? 'Enter details for the new child' : 'Update child information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Child's name"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="child@example.com"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-slate-500 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  If you add an email, your child can sign in to view their own dashboard.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Avatar Color</Label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, avatar_color: color }))}
                      className={`w-10 h-10 rounded-full transition-all ${
                        formData.avatar_color === color 
                          ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: formData.avatar_color }}
                >
                  {formData.name ? formData.name[0].toUpperCase() : '?'}
                </div>
                <div>
                  <p className="font-medium text-slate-700">{formData.name || 'Preview'}</p>
                  <p className="text-sm text-slate-500">Avatar preview</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isAdding ? 'Add Child' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Children List */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p>Loading children...</p>
              </div>
            </CardContent>
          </Card>
        ) : children.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">No Children Yet</h3>
                <p className="text-slate-500 mb-4">Add your first child to start tracking rewards</p>
                <Button onClick={handleAdd} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Child
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {children.map(child => (
              <Card key={child.id} className={editingId === child.id ? 'ring-2 ring-blue-500' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                      style={{ backgroundColor: child.avatar_color }}
                    >
                      {child.name[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate">{child.name}</h3>
                      {child.email ? (
                        <p className="text-sm text-blue-600 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {child.email}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No email set
                        </p>
                      )}
                    </div>

                    {/* Dashboard Toggle */}
                    <button
                      onClick={() => handleToggleDashboard(child)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                        child.can_view_dashboard 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={child.can_view_dashboard ? 'Can view dashboard' : 'Cannot view dashboard'}
                    >
                      {child.can_view_dashboard ? (
                        <>
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Can View</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span className="hidden sm:inline">Hidden</span>
                        </>
                      )}
                    </button>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(child)}
                        disabled={editingId === child.id}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(child.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="space-y-3">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex gap-3">
                <Eye className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Dashboard Visibility</p>
                  <p>
                    Toggle the &ldquo;Can View&rdquo; setting to control whether a child can see their 
                    own dashboard when they log in.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="py-4">
              <div className="flex gap-3">
                <Mail className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-700">
                  <p className="font-medium mb-1">Child Login</p>
                  <p>
                    If you add an email for your child, they can sign in with Google using that 
                    email to view their own progress. They cannot create accounts - only parents can sign up.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
