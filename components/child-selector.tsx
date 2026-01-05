'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { ChevronDown, Plus, User, Check } from 'lucide-react'
import Link from 'next/link'

interface ChildSelectorProps {
  compact?: boolean
  className?: string
  variant?: 'light' | 'dark'
}

export function ChildSelector({ compact = false, className, variant = 'light' }: ChildSelectorProps) {
  const { children, selectedChild, setSelectedChild, isParent } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // No children - show nothing (manage children is in sidebar)
  if (children.length === 0) {
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-rose-500',
    ]
    return colors[index % colors.length]
  }

  // Only ONE child - just show their name (no dropdown)
  if (children.length === 1 && selectedChild) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2', className)}>
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold',
            selectedChild.avatar_color || 'bg-blue-500'
          )}
          style={selectedChild.avatar_color ? { backgroundColor: selectedChild.avatar_color } : undefined}
        >
          {selectedChild.avatar_url ? (
            <img
              src={selectedChild.avatar_url}
              alt={selectedChild.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(selectedChild.name)
          )}
        </div>
        {!compact && (
          <span className={cn(
            'font-medium truncate',
            variant === 'light' ? 'text-slate-700' : 'text-slate-200'
          )}>
            {selectedChild.name}
          </span>
        )}
      </div>
    )
  }

  // Multiple children - show dropdown
  return (
    <div className={cn('relative', className)}>
      {!compact && (
        <label className={cn(
          'text-xs font-medium mb-1 block',
          variant === 'light' ? 'text-slate-600' : 'text-slate-400'
        )}>
          Select Child:
        </label>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full border',
          variant === 'light' 
            ? 'hover:bg-slate-50 active:bg-slate-100 border-slate-200 bg-white' 
            : 'hover:bg-slate-800 active:bg-slate-700 border-slate-700 bg-slate-800',
          compact ? 'px-2' : 'px-3'
        )}
      >
        {selectedChild ? (
          <>
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold',
                getAvatarColor(children.findIndex(c => c.id === selectedChild.id))
              )}
            >
              {selectedChild.avatar_url ? (
                <img
                  src={selectedChild.avatar_url}
                  alt={selectedChild.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(selectedChild.name)
              )}
            </div>
            {!compact && (
              <span className={cn(
                'font-medium max-w-[100px] truncate flex-1 text-left',
                variant === 'light' ? 'text-slate-700' : 'text-slate-200'
              )}>
                {selectedChild.name}
              </span>
            )}
          </>
        ) : (
          <>
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              variant === 'light' ? 'bg-slate-200' : 'bg-slate-700'
            )}>
              <User className={cn('h-4 w-4', variant === 'light' ? 'text-slate-500' : 'text-slate-400')} />
            </div>
            {!compact && <span className={cn(variant === 'light' ? 'text-slate-500' : 'text-slate-400')}>Select child</span>}
          </>
        )}
        <ChevronDown className={cn(
          'h-4 w-4 transition-transform ml-auto', 
          variant === 'light' ? 'text-slate-400' : 'text-slate-500',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
            <div className="p-2">
              <p className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Select Child
              </p>
              {children.map((child, index) => (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChild(child)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors',
                    selectedChild?.id === child.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0',
                      getAvatarColor(index)
                    )}
                  >
                    {child.avatar_url ? (
                      <img
                        src={child.avatar_url}
                        alt={child.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(child.name)
                    )}
                  </div>
                  <span className="flex-1 text-left font-medium truncate">{child.name}</span>
                  {selectedChild?.id === child.id && (
                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            
            {isParent && children.length > 1 && (
              <div className="border-t border-slate-100 p-2">
                <Link href="/children" onClick={() => setIsOpen(false)}>
                  <button className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Manage Children</span>
                  </button>
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
