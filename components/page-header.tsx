'use client'

import { useAuth } from '@/contexts/auth-context'
import { ChildSelector } from '@/components/child-selector'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface PageHeaderProps {
  title?: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const { selectedChild } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:pl-6 lg:pr-8 py-3 sm:py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {title && <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{title}</h1>}
          {description && <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{description}</p>}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Custom Actions */}
          {actions}
          
          {/* Child Selector in Header - Desktop */}
          <div className="hidden lg:block min-w-[200px]">
            <ChildSelector variant="light" />
          </div>
        </div>
      </div>
    </header>
  )
}
