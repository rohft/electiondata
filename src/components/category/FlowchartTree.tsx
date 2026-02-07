import { useState } from "react";
import { Category } from "@/types/category";
import { ChevronRight, ChevronDown, Plus, Trash2, Pencil, GripVertical, Upload, Link2, X } from "lucide-react";
import { cn } from "@/lib/utils";

function findCategoryName(categories: Category[], id: string): string {
  for (const cat of categories) {
    if (cat.id === id) return cat.name;
    const found = findCategoryName(cat.children, id);
    if (found) return found;
  }
  return "Unknown";
}

interface FlowchartTreeProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (parentId: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
  onBulkUpload: (parentId: string) => void;
  onLink: (id: string) => void;
  onUnlink: (sourceId: string, targetId: string) => void;
  onRenameLink: (sourceId: string, targetId: string) => void;
}

interface TreeNodeProps {
  category: Category;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (parentId: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
  onBulkUpload: (parentId: string) => void;
  onLink: (id: string) => void;
  onUnlink: (sourceId: string, targetId: string) => void;
  onRenameLink: (sourceId: string, targetId: string) => void;
  allCategories: Category[];
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}

function TreeNode({
  category,
  depth,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
  onBulkUpload,
  onLink,
  onUnlink,
  onRenameLink,
  allCategories,
  expandedIds,
  toggleExpand,
}: TreeNodeProps) {
  const isExpanded = expandedIds.has(category.id);
  const hasChildren = category.children.length > 0;
  const isSelected = selectedId === category.id;

  return (
    <div className="relative">
      {depth > 0 && (
        <div
          className="absolute top-4 border-t-2 border-muted-foreground/20"
          style={{ left: -20, width: 20 }}
        />
      )}

      <div
        className={cn(
          "flow-node group flex items-center gap-2 mb-2 min-w-[180px]",
          isSelected && "active"
        )}
        onClick={() => onSelect(category.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(category.id);
          }}
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-accent"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )
          ) : (
            <GripVertical className="w-3 h-3 text-muted-foreground/40" />
          )}
        </button>

        <span className="font-medium text-sm flex-1 truncate">
          {category.name}
        </span>

        {category.linkedIds.length > 0 && (
          <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
            🔗 {category.linkedIds.length}
          </span>
        )}

        {hasChildren && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {category.children.length}
          </span>
        )}

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(category.id); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary hover:text-primary-foreground transition-colors"
            title="Add child"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBulkUpload(category.id); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary hover:text-primary-foreground transition-colors"
            title="Bulk upload children"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onLink(category.id); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary hover:text-primary-foreground transition-colors"
            title="Link to other categories"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRename(category.id); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
            title="Rename"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Linked categories displayed as badges */}
      {category.linkedIds.length > 0 && (
        <div className="ml-7 mb-2 flex flex-wrap gap-1.5">
          {category.linkedIds.map((link) => {
            const linkedName = findCategoryName(allCategories, link.id);
            return (
              <span
                key={link.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                <Link2 className="w-3 h-3" />
                <span className="font-semibold">{link.name}</span>
                <span className="text-primary/60">→ {linkedName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameLink(category.id, link.id);
                  }}
                  className="hover:text-accent-foreground transition-colors ml-0.5"
                  title="Rename link"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnlink(category.id, link.id);
                  }}
                  className="hover:text-destructive transition-colors ml-0.5"
                  title="Remove link"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {hasChildren && isExpanded && (
        <div className="ml-8 pl-5 border-l-2 border-muted-foreground/20 relative">
          {category.children.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAdd={onAdd}
              onDelete={onDelete}
              onRename={onRename}
              onBulkUpload={onBulkUpload}
              onLink={onLink}
              onUnlink={onUnlink}
              onRenameLink={onRenameLink}
              allCategories={allCategories}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FlowchartTree({
  categories,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
  onBulkUpload,
  onLink,
  onUnlink,
  onRenameLink,
}: FlowchartTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    categories.forEach((cat) => {
      ids.add(cat.id);
      cat.children.forEach((child) => ids.add(child.id));
    });
    return ids;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-6 overflow-auto">
      {categories.map((cat) => (
        <TreeNode
          key={cat.id}
          category={cat}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onAdd={onAdd}
          onDelete={onDelete}
          onRename={onRename}
          onBulkUpload={onBulkUpload}
          onLink={onLink}
          onUnlink={onUnlink}
          onRenameLink={onRenameLink}
          allCategories={categories}
          expandedIds={expandedIds}
          toggleExpand={toggleExpand}
        />
      ))}
    </div>
  );
}
