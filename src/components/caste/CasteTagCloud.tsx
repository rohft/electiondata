import React, { useState, useMemo } from 'react';
import { useCustomTags } from '@/contexts/CustomTagsContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { detectCasteFromName } from '@/lib/casteData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Cloud, Edit3, Trash2, MoreVertical, AlertCircle, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Scale sizes for tag cloud based on voter count
const TAG_SIZES = [
  'text-xs px-2 py-0.5',
  'text-sm px-2.5 py-1',
  'text-base px-3 py-1',
  'text-lg px-3.5 py-1.5',
  'text-xl px-4 py-2',
] as const;

// Color palette for tags using semantic tokens
const TAG_COLORS = [
  'bg-primary/15 text-primary border-primary/30 hover:bg-primary/25',
  'bg-accent/15 text-accent-foreground border-accent/30 hover:bg-accent/25',
  'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20',
  'bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/80',
  'bg-warning/15 text-warning border-warning/30 hover:bg-warning/25',
  'bg-muted text-muted-foreground border-border hover:bg-muted/80',
] as const;

interface TagData {
  name: string;
  voterCount: number;
  sizeClass: string;
  colorClass: string;
}

export const CasteTagCloud: React.FC = () => {
  const { getVisibleCastes, renameCaste, removeCaste, addCaste } = useCustomTags();
  const { municipalities } = useVoterData();

  const [searchTerm, setSearchTerm] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [renameTo, setRenameTo] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Count voters per ethnic group
  const voterCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    municipalities.forEach((m) =>
      m.wards.forEach((w) =>
        w.voters.forEach((v) => {
          const detected = detectCasteFromName(v.fullName);
          const caste = v.caste || detected.caste || 'Other';
          counts[caste] = (counts[caste] || 0) + 1;
        })
      )
    );
    return counts;
  }, [municipalities]);

  // Build tag data with sizing
  const tagData: TagData[] = useMemo(() => {
    const castes = getVisibleCastes();
    const counts = castes.map((c) => voterCountMap[c] || 0);
    const maxCount = Math.max(...counts, 1);
    const minCount = Math.min(...counts.filter((c) => c > 0), 0);

    return castes.map((name, i) => {
      const count = counts[i];
      // Normalize to 0-4 range for size
      const ratio = maxCount > minCount ? (count - minCount) / (maxCount - minCount) : 0.5;
      const sizeIdx = count === 0 ? 0 : Math.min(Math.floor(ratio * 4), 4);
      const colorIdx = i % TAG_COLORS.length;

      return {
        name,
        voterCount: count,
        sizeClass: TAG_SIZES[sizeIdx],
        colorClass: TAG_COLORS[colorIdx],
      };
    });
  }, [getVisibleCastes, voterCountMap]);

  // Filter tags
  const filteredTags = useMemo(() => {
    if (!searchTerm.trim()) return tagData;
    const term = searchTerm.toLowerCase();
    return tagData.filter((t) => t.name.toLowerCase().includes(term));
  }, [tagData, searchTerm]);

  const handleRenameClick = (name: string) => {
    setSelectedTag(name);
    setRenameTo(name);
    setShowRenameDialog(true);
  };

  const confirmRename = () => {
    if (!selectedTag || !renameTo.trim() || selectedTag === renameTo.trim()) return;
    renameCaste(selectedTag, renameTo.trim());
    toast.success(`Renamed "${selectedTag}" to "${renameTo.trim()}"`);
    setShowRenameDialog(false);
    setSelectedTag(null);
  };

  const handleDeleteClick = (name: string) => {
    setSelectedTag(name);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedTag) return;
    removeCaste(selectedTag);
    toast.success(`Deleted "${selectedTag}"`);
    setShowDeleteDialog(false);
    setSelectedTag(null);
  };

  const confirmAdd = () => {
    if (!newTagName.trim()) return;
    addCaste(newTagName.trim());
    toast.success(`Added "${newTagName.trim()}"`);
    setShowAddDialog(false);
    setNewTagName('');
  };

  return (
    <>
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Cloud className="h-5 w-5 text-accent" />
              Ethnic Group Tag Cloud
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Tag
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ethnic groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tag Cloud */}
          <div className="flex flex-wrap gap-2 items-center justify-center min-h-[120px] p-4 rounded-lg bg-muted/30 border border-border/50">
            {filteredTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ethnic groups found.</p>
            ) : (
              filteredTags.map((tag) => (
                <div key={tag.name} className="group relative inline-flex items-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      'cursor-default transition-all border rounded-full font-medium gap-1.5',
                      tag.sizeClass,
                      tag.colorClass
                    )}
                  >
                    <span>{tag.name}</span>
                    {tag.voterCount > 0 && (
                      <span className="opacity-60 text-[0.75em]">({tag.voterCount})</span>
                    )}

                    {/* Action dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-0.5 hover:bg-background/50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => handleRenameClick(tag.name)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(tag.name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Badge>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <p className="text-xs text-muted-foreground text-center">
            {filteredTags.length} ethnic group{filteredTags.length !== 1 ? 's' : ''} · Hover a tag for actions · Size reflects voter count
          </p>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Ethnic Group Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="e.g., Brahmin"
              onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={confirmAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Ethnic Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New Name</Label>
            <Input
              value={renameTo}
              onChange={(e) => setRenameTo(e.target.value)}
              placeholder={selectedTag || ''}
              onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={confirmRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Ethnic Group?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{selectedTag}" from the tag cloud. Voters assigned to this group will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
