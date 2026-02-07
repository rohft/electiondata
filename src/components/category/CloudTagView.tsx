import { Category } from "@/types/category";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CloudTagViewProps {
  tags: { cat: Category; depth: number }[];
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const sizeClasses = [
  "cloud-tag cloud-tag-lg font-semibold",
  "cloud-tag",
  "cloud-tag cloud-tag-sm",
  "cloud-tag cloud-tag-sm opacity-80",
];

export function CloudTagView({ tags, onDelete, onSelect, selectedId }: CloudTagViewProps) {
  return (
    <div className="flex flex-wrap gap-2 p-6">
      {tags.map(({ cat, depth }) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            sizeClasses[Math.min(depth, sizeClasses.length - 1)],
            selectedId === cat.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          {cat.name}
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(cat.id);
            }}
            className="ml-1 hover:text-destructive transition-colors"
          >
            <X className="w-3 h-3" />
          </span>
        </button>
      ))}
      {tags.length === 0 && (
        <p className="text-muted-foreground text-sm">No categories yet. Add some to get started.</p>
      )}
    </div>
  );
}
