import { useState, useEffect } from 'react';
import { Category } from '@/types/category';
import {
  Building2,
  Folder,
  FolderTree,
  Grid3x3,
  LayoutGrid,
  Maximize2,
  Minimize2 } from
'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import { Button } from '@/components/ui/button';

interface IconGridViewProps {
  tags: {cat: Category;depth: number;}[];
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

type IconSize = 'small' | 'medium' | 'large';

const STORAGE_KEY = 'category-icon-size';

// Helper to count total items (category + all descendants)
function countCategoryItems(category: Category): number {
  let count = 1; // Count self
  category.children.forEach((child) => {
    count += countCategoryItems(child);
  });
  return count;
}

// Get appropriate icon based on category depth
function getCategoryIcon(depth: number) {
  if (depth === 0) return Building2;
  if (depth === 1) return FolderTree;
  return Folder;
}

export function IconGridView({ tags, onDelete, onSelect, selectedId }: IconGridViewProps) {
  // Load size from localStorage or default to medium
  const [iconSize, setIconSize] = useState<IconSize>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved as IconSize || 'medium';
  });

  // Save to localStorage whenever size changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, iconSize);
  }, [iconSize]);

  // Grid columns based on size
  const gridCols = {
    small: 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10',
    medium: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    large: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  // Card size classes
  const cardSize = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  // Icon size classes
  const iconSizeClass = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  // Text size classes
  const textSize = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  // Badge size
  const badgeSize = {
    small: 'text-[10px] px-1.5 py-0.5',
    medium: 'text-xs px-2 py-0.5',
    large: 'text-sm px-2.5 py-1'
  };

  return (
    <div className="space-y-4 p-6">
      {/* Size Control Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">Icon Size:</span>
          
          {/* Button Controls */}
          <div className="flex items-center bg-card border rounded-lg p-1 gap-1">
            <Button
              variant={iconSize === 'small' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setIconSize('small')}
              className={cn(
                'h-8 gap-2 transition-all',
                iconSize === 'small' && 'shadow-sm'
              )}
              title="Small icons">

              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Small</span>
            </Button>
            <Button
              variant={iconSize === 'medium' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setIconSize('medium')}
              className={cn(
                'h-8 gap-2 transition-all',
                iconSize === 'medium' && 'shadow-sm'
              )}
              title="Medium icons">

              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Medium</span>
            </Button>
            <Button
              variant={iconSize === 'large' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setIconSize('large')}
              className={cn(
                'h-8 gap-2 transition-all',
                iconSize === 'large' && 'shadow-sm'
              )}
              title="Large icons">

              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Large</span>
            </Button>
          </div>

          {/* Dropdown Alternative */}
          <Select value={iconSize} onValueChange={(v) => setIconSize(v as IconSize)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">
                <div className="flex items-center gap-2">
                  <Minimize2 className="w-3.5 h-3.5" />
                  Small
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="large">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Large
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {tags.length} {tags.length === 1 ? 'category' : 'categories'}
        </div>
      </div>

      {/* Icon Grid */}
      {tags.length === 0 ?
      <div className="flex flex-col items-center justify-center py-16 text-center">
          <Grid3x3 className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground text-sm">
            No categories yet. Add some to get started.
          </p>
        </div> :

      <div
        className={cn(
          'grid gap-4 transition-all duration-300',
          gridCols[iconSize]
        )}>

          {tags.map(({ cat, depth }) => {
          const Icon = getCategoryIcon(depth);
          const itemCount = countCategoryItems(cat);
          const isSelected = selectedId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                'group relative flex flex-col items-center justify-center',
                'bg-card border rounded-lg transition-all duration-200',
                'hover:shadow-lg hover:scale-105 hover:border-primary/50',
                cardSize[iconSize],
                isSelected &&
                'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg scale-105 border-primary'
              )}>

                {/* Icon */}
                <div
                className={cn(
                  'rounded-full bg-primary/10 flex items-center justify-center mb-3',
                  'transition-all group-hover:bg-primary/20 group-hover:scale-110',
                  isSelected && 'bg-primary/20',
                  // Icon container size based on icon size
                  iconSize === 'small' && 'p-2',
                  iconSize === 'medium' && 'p-3',
                  iconSize === 'large' && 'p-4'
                )}>

                  <Icon
                  className={cn(
                    'text-primary transition-colors',
                    iconSizeClass[iconSize]
                  )} />

                </div>

                {/* Category Name */}
                <h3
                className={cn(
                  'font-semibold text-foreground text-center line-clamp-2 mb-2 transition-colors',
                  'group-hover:text-primary',
                  textSize[iconSize],
                  iconSize === 'small' && 'leading-tight'
                )}
                title={cat.name}>

                  {cat.name}
                </h3>

                {/* Metadata */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {/* Item count badge */}
                  <span
                  className={cn(
                    'inline-flex items-center rounded-full',
                    'bg-muted text-muted-foreground font-medium',
                    'transition-colors group-hover:bg-primary/10 group-hover:text-primary',
                    badgeSize[iconSize]
                  )}>

                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>

                  {/* Depth badge (only for larger sizes) */}
                  {iconSize !== 'small' &&
                <span
                  className={cn(
                    'inline-flex items-center rounded-full',
                    'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium',
                    badgeSize[iconSize]
                  )}>

                      L{depth}
                    </span>
                }

                  {/* Linked categories indicator (only for larger sizes) */}
                  {iconSize !== 'small' && cat.linkedIds.length > 0 &&
                <span
                  className={cn(
                    'inline-flex items-center rounded-full',
                    'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium',
                    badgeSize[iconSize]
                  )}>

                      🔗 {cat.linkedIds.length}
                    </span>
                }
                </div>

                {/* Delete button (shown on hover) */}
                <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(cat.id);
                }}
                className={cn(
                  'absolute top-2 right-2 w-6 h-6 rounded-full',
                  'bg-destructive/90 text-destructive-foreground',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  'hover:bg-destructive hover:scale-110',
                  'flex items-center justify-center'
                )}
                title="Delete category">

                  ×
                </button>

                {/* Selection indicator */}
                {isSelected &&
              <div className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none animate-pulse" />
              }
              </button>);

        })}
        </div>
      }
    </div>);

}