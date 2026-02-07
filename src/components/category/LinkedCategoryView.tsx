import { Category, CategoryLink } from "@/types/category";
import { Link2, ChevronRight, ChevronDown, X, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LinkedCategoryViewProps {
  category: Category;
  allCategories: Category[];
  onClose: () => void;
  onSelectCategory: (id: string) => void;
}

function findCategoryById(categories: Category[], id: string): Category | null {
  for (const cat of categories) {
    if (cat.id === id) return cat;
    const found = findCategoryById(cat.children, id);
    if (found) return found;
  }
  return null;
}

function MiniTreeNode({ category, depth, onSelect }: {category: Category;depth: number;onSelect: (id: string) => void;}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = category.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm hover:bg-accent/50 cursor-pointer transition-colors"
        )}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => onSelect(category.id)}>

        {hasChildren ?
        <button
          onClick={(e) => {e.stopPropagation();setExpanded(!expanded);}}
          className="w-4 h-4 shrink-0 flex items-center justify-center">

            {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </button> :

        <span className="w-4 h-4 shrink-0" />
        }
        <span className="truncate">{category.name}</span>
        {hasChildren &&
        <span className="text-xs text-muted-foreground ml-auto">{category.children.length}</span>
        }
      </div>
      {hasChildren && expanded &&
      <div>
          {category.children.map((child) =>
        <MiniTreeNode key={child.id} category={child} depth={depth + 1} onSelect={onSelect} />
        )}
        </div>
      }
    </div>);

}

export function LinkedCategoryView({ category, allCategories, onClose, onSelectCategory }: LinkedCategoryViewProps) {
  if (category.linkedIds.length === 0) return null;

  const linkedCategories = category.linkedIds.
  map((link) => ({
    link,
    category: findCategoryById(allCategories, link.id)
  })).
  filter((item) => item.category !== null) as {link: CategoryLink;category: Category;}[];

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b bg-accent/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">
            Linked to "{category.name}"
          </h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {linkedCategories.length} link{linkedCategories.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="divide-y max-h-[400px] overflow-auto">
        {linkedCategories.map(({ link, category: linkedCat }) =>
        <div key={link.id} className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">{link.name}</span>
            </div>
            <div className="border rounded-lg bg-background/50 py-1">
              <MiniTreeNode category={linkedCat} depth={0} onSelect={onSelectCategory} />
            </div>
          </div>
        )}
      </div>
    </div>);

}