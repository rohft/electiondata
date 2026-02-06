import React, { useState } from 'react';
import { useVoterData, BoothCentre } from '@/contexts/VoterDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Plus, MapPin, MoreHorizontal, Edit3, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface ExplorerBoothManagerProps {
  municipalityId: string;
  wardId: string;
  boothCentres: BoothCentre[];
}

export const ExplorerBoothManager: React.FC<ExplorerBoothManagerProps> = ({
  municipalityId,
  wardId,
  boothCentres,
}) => {
  const { addBoothCentre, updateBoothCentre, removeBoothCentre } = useVoterData();

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BoothCentre | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addBoothCentre(municipalityId, wardId, newName.trim());
    toast.success(`Booth "${newName.trim()}" added`);
    setNewName('');
    setIsAdding(false);
  };

  const handleRename = (boothId: string) => {
    if (!renameValue.trim()) return;
    updateBoothCentre(municipalityId, wardId, boothId, renameValue.trim());
    toast.success('Booth renamed');
    setRenamingId(null);
    setRenameValue('');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    removeBoothCentre(municipalityId, wardId, deleteTarget.id);
    toast.success(`Booth "${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  };

  const startRename = (booth: BoothCentre) => {
    setRenamingId(booth.id);
    setRenameValue(booth.name);
  };

  return (
    <div className="space-y-0.5">
      {/* Booth items */}
      {boothCentres.map((booth) => (
        <div key={booth.id} className="group flex items-center">
          {renamingId === booth.id ? (
            <div className="flex items-center gap-1 flex-1 px-2 py-0.5">
              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(booth.id);
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                className="h-6 text-xs px-1.5 py-0"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                onClick={() => handleRename(booth.id)}
              >
                <Check className="h-3 w-3 text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                onClick={() => setRenamingId(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-center gap-1.5 h-6 px-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0 text-accent" />
                <span className="truncate">{booth.name}</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="end" side="right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-7 text-xs"
                    onClick={() => startRename(booth)}
                  >
                    <Edit3 className="h-3 w-3" />
                    Rename
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(booth)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      ))}

      {/* Add new booth inline */}
      {isAdding ? (
        <div className="flex items-center gap-1 px-2 py-0.5">
          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setIsAdding(false); setNewName(''); }
            }}
            placeholder="Booth name..."
            className="h-6 text-xs px-1.5 py-0"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={handleAdd}
          >
            <Check className="h-3 w-3 text-green-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={() => { setIsAdding(false); setNewName(''); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5 h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-3 w-3 shrink-0" />
          <span>Add Booth...</span>
        </Button>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booth Centre?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
