import { useState, useRef } from "react";
import { Category } from "@/types/category";
import { CategoryField, FieldType } from "@/types/categoryData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Image,
  ListChecks,
  List,
  FileText,
  X } from
"lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CategoryManagementProps {
  categories: Category[];
  addCategory: (parentId: string | null, name: string) => void;
  deleteCategory: (id: string) => void;
  dataMap: Record<string, {fields: CategoryField[];data: {fieldId: string;value: string | string[] | null;}[];}>;
  addField: (categoryId: string, field: Omit<CategoryField, "id">) => void;
  removeField: (categoryId: string, fieldId: string) => void;
  updateFieldData: (categoryId: string, fieldId: string, value: string | string[] | null) => void;
  addFieldOption: (categoryId: string, fieldId: string, label: string) => void;
  removeFieldOption: (categoryId: string, fieldId: string, optionId: string) => void;
  getFieldsForCategory: (categoryId: string) => {fields: CategoryField[];data: {fieldId: string;value: string | string[] | null;}[];};
}

const FIELD_TYPES: {value: FieldType;label: string;icon: typeof List;}[] = [
{ value: "single-select", label: "Single Select", icon: List },
{ value: "multi-select", label: "Multi Select", icon: ListChecks },
{ value: "photo", label: "Upload Photo", icon: Image },
{ value: "notes", label: "Notes", icon: FileText }];


function findCategoryById(categories: Category[], id: string): Category | null {
  for (const cat of categories) {
    if (cat.id === id) return cat;
    const found = findCategoryById(cat.children, id);
    if (found) return found;
  }
  return null;
}

function CategoryNode({
  category,
  depth,
  selectedId,
  onSelect,
  onDelete,
  onAddChild,
  expandedIds,
  toggleExpand









}: {category: Category;depth: number;selectedId: string | null;onSelect: (id: string) => void;onDelete: (id: string) => void;onAddChild: (parentId: string) => void;expandedIds: Set<string>;toggleExpand: (id: string) => void;}) {
  const isExpanded = expandedIds.has(category.id);
  const hasChildren = category.children.length > 0;
  const isSelected = selectedId === category.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group",
          isSelected ?
          "bg-primary/10 border border-primary/30" :
          "hover:bg-muted border border-transparent"
        )}
        style={{ marginLeft: depth * 20 }}
        onClick={() => onSelect(category.id)}>

        <button
          onClick={(e) => {e.stopPropagation();toggleExpand(category.id);}}
          className="w-5 h-5 flex items-center justify-center shrink-0">

          {hasChildren ?
          isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" /> :

          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          }
        </button>
        <span className="text-sm font-medium flex-1 truncate">{category.name}</span>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={(e) => {e.stopPropagation();onAddChild(category.id);}}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary hover:text-primary-foreground transition-colors"
            title="Add child">

            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {e.stopPropagation();onDelete(category.id);}}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
            title="Delete">

            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {hasChildren && isExpanded &&
      <div>
          {category.children.map((child) =>
        <CategoryNode
          key={child.id}
          category={child}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
          onAddChild={onAddChild}
          expandedIds={expandedIds}
          toggleExpand={toggleExpand} />

        )}
        </div>
      }
    </div>);

}

function FieldRenderer({
  field,
  entry,
  categoryId,
  updateFieldData,
  removeField,
  addFieldOption,
  removeFieldOption








}: {field: CategoryField;entry: {fieldId: string;value: string | string[] | null;};categoryId: string;updateFieldData: CategoryManagementProps["updateFieldData"];removeField: CategoryManagementProps["removeField"];addFieldOption: CategoryManagementProps["addFieldOption"];removeFieldOption: CategoryManagementProps["removeFieldOption"];}) {
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddOption = () => {
    if (newOptionLabel.trim()) {
      addFieldOption(categoryId, field.id, newOptionLabel.trim());
      setNewOptionLabel("");
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-sm">{field.label}</Label>
        <button
          onClick={() => removeField(categoryId, field.id)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
          title="Remove field">

          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {field.type === "single-select" &&
      <div className="space-y-2">
          <Select
          value={entry.value as string || ""}
          onValueChange={(v) => updateFieldData(categoryId, field.id, v)}>

            <SelectTrigger>
              <SelectValue placeholder="Select one..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) =>
            <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
            )}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-1.5">
            {(field.options || []).map((opt) =>
          <span key={opt.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                {opt.label}
                <button onClick={() => removeFieldOption(categoryId, field.id, opt.id)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
          )}
          </div>
          <div className="flex gap-2">
            <Input
            placeholder="Add option..."
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
            className="h-8 text-xs" />

            <Button size="sm" variant="outline" onClick={handleAddOption} disabled={!newOptionLabel.trim()} className="h-8">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      }

      {field.type === "multi-select" &&
      <div className="space-y-2">
          <div className="space-y-1.5 max-h-40 overflow-auto">
            {(field.options || []).map((opt) => {
            const selected = Array.isArray(entry.value) ? entry.value.includes(opt.id) : false;
            return (
              <div key={opt.id} className="flex items-center gap-2 group/opt">
                  <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(entry.value) ? entry.value : [];
                    const next = checked ?
                    [...current, opt.id] :
                    current.filter((id) => id !== opt.id);
                    updateFieldData(categoryId, field.id, next);
                  }} />

                  <span className="text-sm flex-1">{opt.label}</span>
                  <button
                  onClick={() => removeFieldOption(categoryId, field.id, opt.id)}
                  className="opacity-0 group-hover/opt:opacity-100 hover:text-destructive transition-opacity">

                    <X className="w-3 h-3" />
                  </button>
                </div>);

          })}
          </div>
          <div className="flex gap-2">
            <Input
            placeholder="Add option..."
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
            className="h-8 text-xs" />

            <Button size="sm" variant="outline" onClick={handleAddOption} disabled={!newOptionLabel.trim()} className="h-8">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      }

      {field.type === "photo" &&
      <div className="space-y-2">
          {entry.value && typeof entry.value === "string" &&
        <div className="relative inline-block">
              <img src={entry.value} alt="Uploaded" className="w-32 h-32 object-cover rounded-lg border border-border" />
              <button
            onClick={() => updateFieldData(categoryId, field.id, null)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">

                <X className="w-3 h-3" />
              </button>
            </div>
        }
          <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => updateFieldData(categoryId, field.id, reader.result as string);
              reader.readAsDataURL(file);
            }
          }} />

          <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2">

            <Image className="w-4 h-4" />
            {entry.value ? "Change Photo" : "Upload Photo"}
          </Button>
        </div>
      }

      {field.type === "notes" &&
      <Textarea
        placeholder="Add notes..."
        value={entry.value as string || ""}
        onChange={(e) => updateFieldData(categoryId, field.id, e.target.value)}
        rows={3} />

      }
    </div>);

}

export function CategoryManagement({
  categories,
  addCategory,
  deleteCategory,
  addField,
  removeField,
  updateFieldData,
  addFieldOption,
  removeFieldOption,
  getFieldsForCategory
}: CategoryManagementProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    categories.forEach((cat) => ids.add(cat.id));
    return ids;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else
      next.add(id);
      return next;
    });
  };

  const selectedCat = selectedId ? findCategoryById(categories, selectedId) : null;
  const catData = selectedId ? getFieldsForCategory(selectedId) : { fields: [], data: [] };

  const handleAddRoot = () => {
    if (newCatName.trim()) {
      addCategory(null, newCatName.trim());
      setNewCatName("");
      toast.success(`Added "${newCatName.trim()}"`);
    }
  };

  const handleAddChild = (parentId: string) => {
    addCategory(parentId, "New Subcategory");
    toast.success("Added subcategory");
  };

  const handleDelete = (id: string) => {
    const cat = findCategoryById(categories, id);
    deleteCategory(id);
    if (selectedId === id) setSelectedId(null);
    toast.success(`Deleted "${cat?.name ?? "category"}"`);
  };

  const handleAddField = (type: FieldType) => {
    if (!selectedId) return;
    const fieldType = FIELD_TYPES.find((f) => f.value === type);
    addField(selectedId, {
      type,
      label: fieldType?.label || type,
      options: type === "single-select" || type === "multi-select" ? [] : undefined
    });
    toast.success(`Added ${fieldType?.label} field`);
  };

  return (
    <div className="flex min-h-[500px]">
      {/* Left: Category Tree */}
      <div className="w-72 border-r border-border p-4 space-y-3 overflow-auto shrink-0">
        <div className="flex items-center gap-2">
          <Input
            placeholder="New category..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRoot()}
            className="h-9 text-sm" />

          <Button size="icon" variant="outline" onClick={handleAddRoot} disabled={!newCatName.trim()} className="h-9 w-9 shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-0.5">
          {categories.map((cat) =>
          <CategoryNode
            key={cat.id}
            category={cat}
            depth={0}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand} />

          )}
        </div>
      </div>

      {/* Right: Data Panel */}
      <div className="flex-1 p-6 overflow-auto">
        {selectedCat ?
        <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold text-foreground">{selectedCat.name}</h2>
              <p className="text-sm text-muted-foreground">Configure data inputs for this category</p>
            </div>

            {/* Add Field Buttons */}
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPES.map((ft) =>
            <Button
              key={ft.value}
              variant="outline"
              size="sm"
              onClick={() => handleAddField(ft.value)}
              className="gap-2">

                  <ft.icon className="w-4 h-4" />
                  {ft.label}
                </Button>
            )}
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {catData.fields.length === 0 ?
            <p className="text-sm text-muted-foreground py-8 text-center">
                  No fields added yet. Use the buttons above to add input fields.
                </p> :

            catData.fields.map((field) => {
              const entry = catData.data.find((d) => d.fieldId === field.id) || {
                fieldId: field.id,
                value: null
              };
              return (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  entry={entry}
                  categoryId={selectedId!}
                  updateFieldData={updateFieldData}
                  removeField={removeField}
                  addFieldOption={addFieldOption}
                  removeFieldOption={removeFieldOption} />);


            })
            }
            </div>
          </div> :

        <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Select a category from the left to manage its data fields</p>
          </div>
        }
      </div>
    </div>);

}