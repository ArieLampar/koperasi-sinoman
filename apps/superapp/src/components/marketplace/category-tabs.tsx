'use client'

import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface Category {
  id: string
  name: string
  icon: string
  product_count?: number
}

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
  showProductCount?: boolean
  className?: string
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  showProductCount = false,
  className
}: CategoryTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  // Auto-scroll to active tab
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const activeTab = activeTabRef.current
      const container = tabsRef.current

      const tabRect = activeTab.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      const isTabVisible =
        tabRect.left >= containerRect.left &&
        tabRect.right <= containerRect.right

      if (!isTabVisible) {
        const scrollLeft = activeTab.offsetLeft - (container.offsetWidth / 2) + (activeTab.offsetWidth / 2)

        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        })
      }
    }
  }, [activeCategory])

  return (
    <div className={cn('relative', className)}>
      {/* Horizontal Scrollable Container */}
      <div
        ref={tabsRef}
        className="flex space-x-2 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' }
        }}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id

          return (
            <button
              key={category.id}
              ref={isActive ? activeTabRef : undefined}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'flex-shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-full border transition-all duration-200',
                'text-sm font-medium whitespace-nowrap',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isActive
                  ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50'
              )}
            >
              {/* Category Icon */}
              <span className="text-lg leading-none">
                {category.icon}
              </span>

              {/* Category Name */}
              <span>{category.name}</span>

              {/* Product Count Badge */}
              {showProductCount && category.product_count !== undefined && category.product_count > 0 && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium ml-1',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-100 text-neutral-600'
                )}>
                  {category.product_count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Scroll Indicators */}
      <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  )
}

// Category Tabs Skeleton for loading states
export function CategoryTabsSkeleton({ count = 4, className }: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('flex space-x-2 overflow-x-auto scrollbar-hide', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex-shrink-0 animate-pulse"
        >
          <div className="flex items-center space-x-2 px-4 py-2.5 bg-neutral-200 rounded-full">
            {/* Icon skeleton */}
            <div className="w-5 h-5 bg-neutral-300 rounded" />
            {/* Text skeleton */}
            <div className="h-4 w-16 bg-neutral-300 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Alternative compact version for smaller spaces
export function CategoryTabsCompact({
  categories,
  activeCategory,
  onCategoryChange,
  className
}: Omit<CategoryTabsProps, 'showProductCount'>) {
  return (
    <div className={cn('relative', className)}>
      <div className="flex space-x-1 overflow-x-auto scrollbar-hide scroll-smooth">
        {categories.map((category) => {
          const isActive = activeCategory === category.id

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200',
                'text-xs font-medium whitespace-nowrap min-w-[60px]',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isActive
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-neutral-600 hover:bg-primary-50 hover:text-primary-600'
              )}
            >
              {/* Category Icon */}
              <span className="text-lg leading-none">
                {category.icon}
              </span>

              {/* Category Name */}
              <span className="leading-tight">{category.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Hook for managing category state
export function useCategoryTabs(categories: Category[], defaultCategory?: string) {
  const [activeCategory, setActiveCategory] = useState(defaultCategory || categories[0]?.id || '')

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
  }

  const getActiveCategory = () => {
    return categories.find(cat => cat.id === activeCategory)
  }

  const getNextCategory = () => {
    const currentIndex = categories.findIndex(cat => cat.id === activeCategory)
    const nextIndex = (currentIndex + 1) % categories.length
    return categories[nextIndex]
  }

  const getPreviousCategory = () => {
    const currentIndex = categories.findIndex(cat => cat.id === activeCategory)
    const prevIndex = currentIndex === 0 ? categories.length - 1 : currentIndex - 1
    return categories[prevIndex]
  }

  return {
    activeCategory,
    setActiveCategory,
    handleCategoryChange,
    getActiveCategory,
    getNextCategory,
    getPreviousCategory
  }
}