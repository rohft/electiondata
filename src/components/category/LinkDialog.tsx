import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category } from "@/types/category";
import { Link2, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkDialogProps {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  allCategories: { cat: Category; depth: number }[];
  onLink: (sourceId: string, targetId: string, name: string) => void;
  onUnlink: (sourceId: string, targetId: string) => void;
}

function getAncestorIds(allFlat: { cat: Category; depth: number }[], id: string): Set<string> {
  const ids = new Set<string>();
  let current = allFlat.find((f) => f.cat.id === id);
  while (current && current.cat.parentId) {
    ids.add(current.cat.parentId);
    current = allFlat.find((f) => f.cat.id === current!.cat.parentId);
  }
  return ids;
}

function getDescendantIds(cat: Category): Set<string> {
  const ids = new Set<string>();
  for (const child of cat.children) {
    ids.add(child.id);
    for (const id of getDescendantIds(child)) ids.add(id);
  }
  return ids;
}

export function LinkDialog({
  open,
  onClose,
  category,
  allCategories,
  onLink,
  onUnlink,
}: LinkDialogProps) {
  const [search, setSearch] = useState("");
  const [linkName, setLinkName] = useState("");
  const [pendingTargetId, setPendingTargetId] = useState<string | null>(null);

  const { linked, available } = useMemo(() => {
    if (!category) return { linked: [], available: [] };

    const linkedIds = new Set(category.linkedIds.map((l) => l.id));
    const selfId = category.id;
    const ancestors = getAncestorIds(allCategories, selfId);
    const descendants = getDescendantIds(category);
    const excluded = new Set([selfId, ...ancestors, ...descendants]);

    const linked = allCategories.filter(({ cat }) => linkedIds.has(cat.id));
    const available = allCategories.filter(
      ({ cat }) => !excluded.has(cat.id) && !linkedIds.has(cat.id)
    );

    return { linked, available };
  }, [category, allCategories]);

  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(({ cat }) => cat.name.toLowerCase().includes(q));
  }, [available, search]);

  const handleSelectTarget = (targetId: string) => {
    setPendingTargetId(targetId);
    setLinkName("");
  };

  const handleConfirmLink = () => {
    if (category && pendingTargetId) {
      onLink(category.id, pendingTargetId, linkName.trim());
      setPendingTargetId(null);
      setLinkName("");
    }
  };

  if (!category) return null;

  const pendingTarget = pendingTargetId
    ? allCategories.find(({ cat }) => cat.id === pendingTargetId)?.cat
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setPendingTargetId(null); } }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Link "{category.name}"
          </DialogTitle>
          <DialogDescription>
            Create named cross-references between this category and others.
          </DialogDescription>
        </DialogHeader>

        {pendingTarget && (
          <div className="space-y-2 p-3 border rounded-lg bg-accent/30">
            <p className="text-sm font-medium">
              Linking to <span className="text-primary">{pendingTarget.name}</span>
            </p>
            <Input
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="Enter a name for this link (optional)"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleConfirmLink()}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleConfirmLink}>
                Create Link
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPendingTargetId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {linked.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Linked categories</p>
            <div className="flex flex-wrap gap-1.5">
              {linked.map(({ cat }) => {
                const linkData = category.linkedIds.find((l) => l.id === cat.id);
                return (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    <span className="font-semibold">{linkData?.name || cat.name}</span>
                    <button
                      onClick={() => onUnlink(category.id, cat.id)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {!pendingTargetId && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories to link..."
                className="pl-9"
              />
            </div>

            <div className="flex-1 overflow-auto border rounded-lg max-h-[300px]">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No available categories to link.
                </p>
              ) : (
                <div className="divide-y">
                  {filtered.map(({ cat, depth }) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectTarget(cat.id)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                      )}
                    >
                      <span
                        className="text-muted-foreground text-xs shrink-0"
                        style={{ width: depth * 12 }}
                      />
                      <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{cat.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">depth {depth}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
