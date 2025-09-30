'use client'

import { forwardRef, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FilterIcon,
  XIcon,
  SearchIcon,
  FolderIcon,
  TagIcon
} from 'lucide-react'

// =============================================================================
// CATEGORY FILTER VARIANTS
// =============================================================================

const categoryFilterVariants = cva(
  'w-full',
  {
    variants: {
      variant: {
        default: '',
        compact: '',
        mobile: '',
        sidebar: 'max-w-xs'
      },
      layout: {
        horizontal: 'flex flex-row items-center gap-2',
        vertical: 'flex flex-col space-y-2',
        grid: 'grid grid-cols-2 gap-2',
        list: 'space-y-1'
      }
    },
    defaultVariants: {
      variant: 'default',
      layout: 'vertical'
    }
  }
)

// =============================================================================
// TYPES
// =============================================================================

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  image?: string
  productCount?: number
  parentId?: string
  children?: Category[]
  isActive?: boolean
}

export interface CategoryFilterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof categoryFilterVariants> {
  categories: Category[]
  selectedCategories?: string[]
  onCategoryChange?: (categoryIds: string[]) => void
  multiSelect?: boolean
  showSearch?: boolean
  showProductCount?: boolean
  showIcons?: boolean
  expandedByDefault?: boolean
  maxDisplayed?: number
  placeholder?: string
  searchPlaceholder?: string
  clearLabel?: string
  showAllLabel?: string
  mobileTitle?: string
}

// =============================================================================
// CATEGORY ITEM COMPONENT
// =============================================================================

interface CategoryItemProps {
  category: Category
  isSelected: boolean
  onToggle: (categoryId: string) => void
  multiSelect: boolean
  showProductCount: boolean
  showIcons: boolean
  level?: number
}

const CategoryItem = ({
  category,
  isSelected,
  onToggle,
  multiSelect,
  showProductCount,
  showIcons,
  level = 0
}: CategoryItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = category.children && category.children.length > 0

  const handleToggle = () => {
    onToggle(category.id)
  }

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors',
          isSelected && 'bg-primary/10 border border-primary/20',
          level > 0 && 'ml-4'
        )}
        onClick={handleToggle}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={handleExpand}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-3 w-3" />
            ) : (
              <ChevronRightIcon className="h-3 w-3" />
            )}
          </Button>
        )}

        {/* Checkbox for multi-select */}
        {multiSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleToggle}
            className="h-4 w-4"
          />
        )}

        {/* Category Icon */}
        {showIcons && (
          <div className="w-4 h-4 flex-shrink-0">
            {category.icon ? (
              <img src={category.icon} alt="" className="w-4 h-4 object-cover rounded" />
            ) : (
              <FolderIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}

        {/* Category Name */}
        <span className={cn(
          'flex-1 text-sm',
          isSelected && 'font-medium text-primary'
        )}>
          {category.name}
        </span>

        {/* Product Count */}
        {showProductCount && category.productCount !== undefined && (
          <Badge variant="outline" className="text-xs">
            {category.productCount}
          </Badge>
        )}
      </div>

      {/* Children Categories */}
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {category.children?.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              isSelected={isSelected}
              onToggle={onToggle}
              multiSelect={multiSelect}
              showProductCount={showProductCount}
              showIcons={showIcons}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// CATEGORY GRID COMPONENT
// =============================================================================

const CategoryGrid = ({
  categories,
  selectedCategories = [],
  onCategoryChange,
  multiSelect = false,
  showProductCount = true,
  showIcons = true
}: {
  categories: Category[]
  selectedCategories: string[]
  onCategoryChange?: (categoryIds: string[]) => void
  multiSelect: boolean
  showProductCount: boolean
  showIcons: boolean
}) => {
  const handleCategoryToggle = (categoryId: string) => {
    if (!onCategoryChange) return

    if (multiSelect) {
      const newSelection = selectedCategories.includes(categoryId)
        ? selectedCategories.filter(id => id !== categoryId)
        : [...selectedCategories, categoryId]
      onCategoryChange(newSelection)
    } else {
      onCategoryChange([categoryId])
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.id)

        return (
          <div
            key={category.id}
            className={cn(
              'p-3 rounded-lg border border-border hover:border-primary/20 cursor-pointer transition-all',
              isSelected && 'border-primary bg-primary/5'
            )}
            onClick={() => handleCategoryToggle(category.id)}
          >
            {showIcons && (
              <div className="w-8 h-8 mb-2 flex items-center justify-center">
                {category.icon ? (
                  <img src={category.icon} alt="" className="w-8 h-8 object-cover rounded" />
                ) : category.image ? (
                  <img src={category.image} alt="" className="w-8 h-8 object-cover rounded" />
                ) : (
                  <TagIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            )}

            <h4 className={cn(
              'text-sm font-medium mb-1',
              isSelected && 'text-primary'
            )}>
              {category.name}
            </h4>

            {showProductCount && category.productCount !== undefined && (
              <p className="text-xs text-muted-foreground">
                {category.productCount} produk
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// =============================================================================
// MAIN CATEGORY FILTER COMPONENT
// =============================================================================

const CategoryFilter = forwardRef<HTMLDivElement, CategoryFilterProps>(
  ({
    categories,
    selectedCategories = [],
    onCategoryChange,
    multiSelect = false,
    showSearch = true,
    showProductCount = true,
    showIcons = true,
    expandedByDefault = false,
    maxDisplayed,
    placeholder = 'Pilih kategori',
    searchPlaceholder = 'Cari kategori...',
    clearLabel = 'Hapus semua',
    showAllLabel = 'Lihat semua',
    mobileTitle = 'Filter Kategori',
    variant = 'default',
    layout = 'vertical',
    className,
    ...props
  }, ref) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [showAll, setShowAll] = useState(false)

    const filteredCategories = categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const displayedCategories = maxDisplayed && !showAll
      ? filteredCategories.slice(0, maxDisplayed)
      : filteredCategories

    const hasMore = maxDisplayed && filteredCategories.length > maxDisplayed

    const handleCategoryToggle = (categoryId: string) => {
      if (!onCategoryChange) return

      if (multiSelect) {
        const newSelection = selectedCategories.includes(categoryId)
          ? selectedCategories.filter(id => id !== categoryId)
          : [...selectedCategories, categoryId]
        onCategoryChange(newSelection)
      } else {
        const newSelection = selectedCategories.includes(categoryId) ? [] : [categoryId]
        onCategoryChange(newSelection)
      }
    }

    const handleClearAll = () => {
      onCategoryChange?.([])
    }

    // Mobile Sheet Version
    const MobileFilter = () => (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4" />
              {selectedCategories.length > 0
                ? `${selectedCategories.length} dipilih`
                : placeholder
              }
            </div>
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{mobileTitle}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {showSearch && (
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            <ScrollArea className="h-[50vh]">
              <div className="space-y-2">
                {displayedCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    isSelected={selectedCategories.includes(category.id)}
                    onToggle={handleCategoryToggle}
                    multiSelect={multiSelect}
                    showProductCount={showProductCount}
                    showIcons={showIcons}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              {selectedCategories.length > 0 && (
                <Button variant="outline" onClick={handleClearAll} className="flex-1">
                  {clearLabel}
                </Button>
              )}
              {hasMore && !showAll && (
                <Button variant="outline" onClick={() => setShowAll(true)} className="flex-1">
                  {showAllLabel}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )

    // Desktop Popover Version
    const DesktopFilter = () => (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4" />
              {selectedCategories.length > 0
                ? `${selectedCategories.length} dipilih`
                : placeholder
              }
            </div>
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 space-y-4">
            {showSearch && (
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {displayedCategories.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    isSelected={selectedCategories.includes(category.id)}
                    onToggle={handleCategoryToggle}
                    multiSelect={multiSelect}
                    showProductCount={showProductCount}
                    showIcons={showIcons}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-2 border-t">
              {selectedCategories.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearAll} className="flex-1">
                  {clearLabel}
                </Button>
              )}
              {hasMore && !showAll && (
                <Button variant="outline" size="sm" onClick={() => setShowAll(true)} className="flex-1">
                  {showAllLabel}
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )

    // Sidebar Version
    const SidebarFilter = () => (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Kategori</h3>
          {selectedCategories.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showSearch && (
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        <div className="space-y-2">
          {displayedCategories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              isSelected={selectedCategories.includes(category.id)}
              onToggle={handleCategoryToggle}
              multiSelect={multiSelect}
              showProductCount={showProductCount}
              showIcons={showIcons}
            />
          ))}
        </div>

        {hasMore && !showAll && (
          <Button variant="outline" size="sm" onClick={() => setShowAll(true)} className="w-full">
            {showAllLabel}
          </Button>
        )}
      </div>
    )

    // Grid Layout Version
    const GridFilter = () => (
      <div className="space-y-4">
        {showSearch && (
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        <CategoryGrid
          categories={displayedCategories}
          selectedCategories={selectedCategories}
          onCategoryChange={onCategoryChange}
          multiSelect={multiSelect}
          showProductCount={showProductCount}
          showIcons={showIcons}
        />

        {hasMore && !showAll && (
          <div className="text-center">
            <Button variant="outline" onClick={() => setShowAll(true)}>
              {showAllLabel}
            </Button>
          </div>
        )}

        {selectedCategories.length > 0 && (
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              {clearLabel}
            </Button>
          </div>
        )}
      </div>
    )

    return (
      <div
        ref={ref}
        className={cn(categoryFilterVariants({ variant, layout }), className)}
        {...props}
      >
        {variant === 'mobile' && <MobileFilter />}
        {variant === 'default' && <DesktopFilter />}
        {variant === 'sidebar' && <SidebarFilter />}
        {layout === 'grid' && <GridFilter />}
      </div>
    )
  }
)

CategoryFilter.displayName = 'CategoryFilter'

// =============================================================================
// EXPORTS
// =============================================================================

export {
  CategoryFilter,
  CategoryGrid,
  CategoryItem,
  categoryFilterVariants,
  type Category,
  type CategoryFilterProps
}