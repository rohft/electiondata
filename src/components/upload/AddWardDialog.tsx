import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData, WardData } from '@/contexts/VoterDataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddWardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  municipalityId: string;
  municipalityName: string;
  existingWardNumbers: number[];
}

export const AddWardDialog = ({
  open,
  onOpenChange,
  municipalityId,
  municipalityName,
  existingWardNumbers,
}: AddWardDialogProps) => {
  const { t } = useLanguage();
  const { addWardData } = useVoterData();
  const [wardsToAdd, setWardsToAdd] = useState<number[]>([]);
  const [newWardNumber, setNewWardNumber] = useState('');

  const addWardSlot = (wardNumber: number) => {
    if (existingWardNumbers.includes(wardNumber) || wardsToAdd.includes(wardNumber)) {
      toast.error(`Ward ${wardNumber} already exists or is pending`);
      return;
    }
    setWardsToAdd((prev) => [...prev, wardNumber].sort((a, b) => a - b));
    setNewWardNumber('');
  };

  const removeWardSlot = (wardNumber: number) => {
    setWardsToAdd((prev) => prev.filter((w) => w !== wardNumber));
  };

  const handleSave = () => {
    wardsToAdd.forEach((wardNumber) => {
      const defaultBooth = {
        id: crypto.randomUUID(),
        name: 'Booth 1',
        createdAt: new Date(),
        voters: [],
        fileName: '',
        uploadedAt: new Date(),
      };

      const wardData: WardData = {
        id: crypto.randomUUID(),
        name: `Ward ${wardNumber}`,
        municipality: municipalityName,
        voters: [],
        uploadedAt: new Date(),
        fileName: '',
        boothCentres: [defaultBooth],
      };
      addWardData(municipalityName, wardData);
    });

    toast.success(`${wardsToAdd.length} ward(s) added to ${municipalityName}`);
    setWardsToAdd([]);
    onOpenChange(false);
  };

  // Suggest next ward numbers (gaps + next)
  const maxExisting = Math.max(...existingWardNumbers, 0);
  const suggestedWards: number[] = [];
  for (let i = 1; i <= maxExisting + 5; i++) {
    if (!existingWardNumbers.includes(i) && !wardsToAdd.includes(i)) {
      suggestedWards.push(i);
      if (suggestedWards.length >= 5) break;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('upload.addWardData')} - {municipalityName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Wards Info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">{t('upload.existingWards')}:</p>
            <div className="flex flex-wrap gap-1.5">
              {existingWardNumbers
                .sort((a, b) => a - b)
                .map((num) => (
                  <Badge key={num} variant="secondary" className="text-xs">
                    Ward {num}
                  </Badge>
                ))}
            </div>
          </div>

          {/* Quick Add */}
          {suggestedWards.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('upload.quickAddWards')}:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedWards.map((num) => (
                  <Button key={num} variant="outline" size="sm" onClick={() => addWardSlot(num)} className="gap-1">
                    <Plus className="h-3 w-3" />
                    Ward {num}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Ward Number */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              placeholder="Ward number..."
              value={newWardNumber}
              onChange={(e) => setNewWardNumber(e.target.value)}
              className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => newWardNumber && addWardSlot(parseInt(newWardNumber))}
              disabled={!newWardNumber}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('upload.addWard')}
            </Button>
          </div>

          {/* Wards to Add */}
          {wardsToAdd.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('upload.wardsToUpload')}:</p>
              <ScrollArea className="max-h-[200px] pr-4">
                <div className="space-y-2">
                  {wardsToAdd.map((wardNumber) => (
                    <div
                      key={wardNumber}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted font-semibold text-sm text-muted-foreground">
                          {wardNumber}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Ward {wardNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            Default booth will be created. Upload data via explorer.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeWardSlot(wardNumber)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t border-border/50">
            <Button onClick={handleSave} disabled={wardsToAdd.length === 0}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t('upload.saveWards')} ({wardsToAdd.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
