import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowchartTree } from "@/components/category/FlowchartTree";
import { LinkedCategoryView } from "@/components/category/LinkedCategoryView";
import { CloudTagView } from "@/components/category/CloudTagView";
import { BulkUploadDialog } from "@/components/category/BulkUploadDialog";
import { RenameDialog } from "@/components/category/RenameDialog";
import { LinkDialog } from "@/components/category/LinkDialog";
import { CategoryManagement } from "@/components/category/CategoryManagement";
import { CategoryTableView } from "@/components/category/CategoryTableView";
import { useCategoryTree } from "@/hooks/useCategoryTree";
import { useCategoryData } from "@/hooks/useCategoryData";
import {
  Upload,
  Plus,
  Save,
  Tags,
  GitBranch,
  Trash2,
  LayoutList,
  Table2,
} from "lucide-react";
import { toast } from "sonner";
import { Category } from "@/types/category";

function findCategoryById(categories: Category[], id: string): Category | null {
  for (const cat of categories) {
    if (cat.id === id) return cat;
    const found = findCategoryById(cat.children, id);
    if (found) return found;
  }
  return null;
}

export const CategorySection = () => {
  const {
    categories,
    selectedId,
    setSelectedId,
    addCategory,
    renameCategory,
    deleteCategory,
    bulkUpload,
    getAllTags,
    linkCategory,
    unlinkCategory,
    renameLinkCategory,
  } = useCategoryTree();

  const {
    dataMap,
    addField,
    removeField,
    updateFieldData,
    addFieldOption,
    removeFieldOption,
    getFieldsForCategory,
  } = useCategoryData();

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkParentId, setBulkParentId] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkTargetId, setLinkTargetId] = useState<string | null>(null);
  const [renameLinkOpen, setRenameLinkOpen] = useState(false);
  const [renameLinkTarget, setRenameLinkTarget] = useState<{ sourceId: string; targetId: string; currentName: string } | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [view, setView] = useState<"flowchart" | "tags">("flowchart");

  const handleAdd = (parentId: string | null) => {
    const name = parentId ? "New Subcategory" : "New Category";
    addCategory(parentId, name);
    toast.success(`Added "${name}"`);
  };

  const handleDelete = (id: string) => {
    const cat = findCategoryById(categories, id);
    deleteCategory(id);
    toast.success(`Deleted "${cat?.name ?? "category"}"`);
  };

  const handleRenameInit = (id: string) => {
    const cat = findCategoryById(categories, id);
    if (cat) {
      setRenameTarget({ id, name: cat.name });
      setRenameOpen(true);
    }
  };

  const handleRename = (newName: string) => {
    if (renameTarget) {
      renameCategory(renameTarget.id, newName);
      toast.success(`Renamed to "${newName}"`);
    }
  };

  const handleBulkUpload = (text: string) => {
    bulkUpload(text, bulkParentId);
    const parentName = bulkParentId ? findCategoryById(categories, bulkParentId)?.name : "root";
    toast.success(`Categories uploaded under "${parentName}"`);
  };

  const openBulkUpload = (parentId: string | null) => {
    setBulkParentId(parentId);
    setBulkOpen(true);
  };

  const handleLinkInit = (id: string) => {
    setLinkTargetId(id);
    setLinkOpen(true);
  };

  const handleRenameLinkInit = (sourceId: string, targetId: string) => {
    const cat = findCategoryById(categories, sourceId);
    const link = cat?.linkedIds.find((l) => l.id === targetId);
    setRenameLinkTarget({ sourceId, targetId, currentName: link?.name ?? "" });
    setRenameLinkOpen(true);
  };

  const handleSave = () => {
    toast.success("Categories saved successfully!", {
      description: `${getAllTags().length} categories stored.`,
    });
  };

  const handleAddRoot = () => {
    if (newCatName.trim()) {
      addCategory(null, newCatName.trim());
      setNewCatName("");
      toast.success(`Added "${newCatName.trim()}"`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Manage your category hierarchy</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save All
        </Button>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="bg-card border">
          <TabsTrigger value="categories" className="gap-2">
            <GitBranch className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2">
            <Table2 className="w-4 h-4" />
            Table View
          </TabsTrigger>
          <TabsTrigger value="management" className="gap-2">
            <LayoutList className="w-4 h-4" />
            Category Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
              <Input
                placeholder="New root category..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRoot()}
              />
              <Button onClick={handleAddRoot} size="icon" variant="outline" disabled={!newCatName.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => openBulkUpload(null)} className="gap-2">
                <Upload className="w-4 h-4" />
                Bulk Upload
              </Button>

              {selectedId && (
                <Button
                  variant="outline"
                  onClick={() => handleDelete(selectedId)}
                  className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </Button>
              )}
            </div>

            <div className="ml-auto flex items-center bg-card border rounded-lg p-1">
              <button
                onClick={() => setView("flowchart")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "flowchart"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GitBranch className="w-4 h-4 inline mr-1.5" />
                Flowchart
              </button>
              <button
                onClick={() => setView("tags")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "tags"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Tags className="w-4 h-4 inline mr-1.5" />
                Cloud Tags
              </button>
            </div>
          </div>

          {/* View */}
          <div className="bg-card rounded-xl border min-h-[500px] overflow-auto">
            {view === "flowchart" ? (
              <FlowchartTree
                categories={categories}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAdd={(parentId) => handleAdd(parentId)}
                onDelete={handleDelete}
                onRename={handleRenameInit}
                onBulkUpload={(parentId) => openBulkUpload(parentId)}
                onLink={handleLinkInit}
                onUnlink={(sourceId, targetId) => {
                  unlinkCategory(sourceId, targetId);
                  toast.success("Link removed");
                }}
                onRenameLink={handleRenameLinkInit}
              />
            ) : (
              <CloudTagView
                tags={getAllTags()}
                onDelete={handleDelete}
                onSelect={setSelectedId}
                selectedId={selectedId}
              />
            )}
          </div>

          {/* Linked categories panel */}
          {selectedId && findCategoryById(categories, selectedId)?.linkedIds.length! > 0 && (
            <LinkedCategoryView
              category={findCategoryById(categories, selectedId)!}
              allCategories={categories}
              onClose={() => setSelectedId(null)}
              onSelectCategory={(id) => setSelectedId(id)}
            />
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{getAllTags().length}</strong> total categories
            </span>
            <span>
              <strong className="text-foreground">{categories.length}</strong> root categories
            </span>
            {selectedId && (
              <span className="text-primary font-medium">
                Selected: {findCategoryById(categories, selectedId)?.name}
              </span>
            )}
          </div>
        </TabsContent>

        <TabsContent value="table" className="space-y-6">
          <div className="bg-card rounded-xl border p-4">
            <CategoryTableView
              categories={categories}
              onRename={(id, newName) => {
                renameCategory(id, newName);
              }}
              onSelect={setSelectedId}
              selectedId={selectedId}
            />
          </div>
        </TabsContent>

        <TabsContent value="management">
          <div className="bg-card rounded-xl border overflow-hidden">
            <CategoryManagement
              categories={categories}
              addCategory={addCategory}
              deleteCategory={deleteCategory}
              dataMap={dataMap}
              addField={addField}
              removeField={removeField}
              updateFieldData={updateFieldData}
              addFieldOption={addFieldOption}
              removeFieldOption={removeFieldOption}
              getFieldsForCategory={getFieldsForCategory}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BulkUploadDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onUpload={handleBulkUpload}
        parentName={bulkParentId ? findCategoryById(categories, bulkParentId)?.name : null}
      />
      <RenameDialog
        open={renameOpen}
        currentName={renameTarget?.name ?? ""}
        onClose={() => setRenameOpen(false)}
        onRename={handleRename}
      />
      <LinkDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        category={linkTargetId ? findCategoryById(categories, linkTargetId) : null}
        allCategories={getAllTags()}
        onLink={(sourceId, targetId, name) => {
          linkCategory(sourceId, targetId, name);
          toast.success("Categories linked");
        }}
        onUnlink={(sourceId, targetId) => {
          unlinkCategory(sourceId, targetId);
          toast.success("Link removed");
        }}
      />
      <RenameDialog
        open={renameLinkOpen}
        currentName={renameLinkTarget?.currentName ?? ""}
        onClose={() => setRenameLinkOpen(false)}
        onRename={(newName) => {
          if (renameLinkTarget) {
            renameLinkCategory(renameLinkTarget.sourceId, renameLinkTarget.targetId, newName);
            toast.success(`Link renamed to "${newName}"`);
          }
        }}
      />
    </div>
  );
};
