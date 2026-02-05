import React, { useState } from 'react';
import { useVoterData, BoothCentre } from '@/contexts/VoterDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Edit3, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface BoothCentreManagerProps {
  municipalityId: string;
  wardId: string;
  boothCentres: BoothCentre[];
}

export const BoothCentreManager: React.FC<BoothCentreManagerProps> = ({
  municipalityId,
  wardId,
  boothCentres,
}) => {
  const { addBoothCentre, updateBoothCentre, removeBoothCentre } = useVoterData();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<BoothCentre | null>(null);
  const [boothName, setBoothName] = useState('');

  const handleAdd = () => {
    if (!boothName.trim()) {
      toast.error('Please enter a booth centre name');
      return;
    }
    addBoothCentre(municipalityId, wardId, boothName);
    toast.success(`Booth centre "${boothName}" added`);
    setBoothName('');
    setShowAddDialog(false);
  };

  const handleRename = () => {
    if (!selectedBooth || !boothName.trim()) return;
    updateBoothCentre(municipalityId, wardId, selectedBooth.id, boothName);
    toast.success(`Booth centre renamed to "${boothName}"`);
    setBoothName('');
    setSelectedBooth(null);
    setShowRenameDialog(false);
  };

  const handleDelete = () => {
    if (!selectedBooth) return;
    removeBoothCentre(municipalityId, wardId, selectedBooth.id);
    toast.success(`Booth centre "${selectedBooth.name}" deleted`);
    setSelectedBooth(null);
    setShowDeleteDialog(false);
  };

  const openRenameDialog = (booth: BoothCentre) => {
    setSelectedBooth(booth);
    setBoothName(booth.name);
    setShowRenameDialog(true);
  };

  const openDeleteDialog = (booth: BoothCentre) => {
    setSelectedBooth(booth);
    setShowDeleteDialog(true);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            Voting Booth Centres
            <Badge variant="secondary" className="ml-2">
              {boothCentres.length}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBoothName('');
              setShowAddDialog(true);
            }}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Booth
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {boothCentres.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No booth centres added yet. Click "Add Booth" to create one.
          </p>
        ) : (
          <div className="space-y-2">
            {boothCentres.map((booth, index) => (
              <div
                key={booth.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <span className="text-sm font-medium">{booth.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openRenameDialog(booth)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => openDeleteDialog(booth)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Voting Booth Centre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Booth Centre Name</Label>
              <Input
                value={boothName}
                onChange={(e) => setBoothName(e.target.value)}
                placeholder="e.g., Primary School Hall"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Booth Centre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Name</Label>
              <Input
                value={boothName}
                onChange={(e) => setBoothName(e.target.value)}
                placeholder={selectedBooth?.name || ''}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booth Centre?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the booth centre "{selectedBooth?.name}".
              This action cannot be undone.
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
    </Card>
  );
};
