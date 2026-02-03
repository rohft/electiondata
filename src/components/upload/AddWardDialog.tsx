import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData, WardData } from '@/contexts/VoterDataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Loader2,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { parseFile, getSupportedFormats, getSupportedFormatsText, ParsedRecord } from '@/lib/fileParser';
import { isNewarName } from '@/lib/surnameUtils';

interface AddWardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  municipalityId: string;
  municipalityName: string;
  existingWardNumbers: number[];
}

interface WardUploadState {
  wardNumber: number;
  file: File | null;
  records: ParsedRecord[];
  status: 'pending' | 'uploaded' | 'error';
  fileName?: string;
}

export const AddWardDialog = ({ 
  open, 
  onOpenChange, 
  municipalityId,
  municipalityName, 
  existingWardNumbers 
}: AddWardDialogProps) => {
  const { t } = useLanguage();
  const { addWardData } = useVoterData();
  const [wardsToUpload, setWardsToUpload] = useState<WardUploadState[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [newWardNumber, setNewWardNumber] = useState('');

  const addWardSlot = (wardNumber: number) => {
    if (existingWardNumbers.includes(wardNumber) || wardsToUpload.some(w => w.wardNumber === wardNumber)) {
      toast.error(`Ward ${wardNumber} already exists or is pending`);
      return;
    }
    const newWard: WardUploadState = {
      wardNumber,
      file: null,
      records: [],
      status: 'pending'
    };
    setWardsToUpload(prev => [...prev, newWard].sort((a, b) => a.wardNumber - b.wardNumber));
    setNewWardNumber('');
  };

  const removeWardSlot = (wardNumber: number) => {
    setWardsToUpload(prev => prev.filter(w => w.wardNumber !== wardNumber));
  };

  const handleFileUpload = useCallback(async (wardNumber: number, file: File) => {
    const idx = wardsToUpload.findIndex(w => w.wardNumber === wardNumber);
    if (idx === -1) return;
    
    setUploadingIndex(idx);
    
    try {
      const records = await parseFile(file);
      
      if (records.length === 0) {
        setWardsToUpload(prev => prev.map(w => 
          w.wardNumber === wardNumber 
            ? { ...w, file, records: [], status: 'error' as const }
            : w
        ));
        toast.error(`No valid records found in ${file.name}`);
        return;
      }

      setWardsToUpload(prev => prev.map(w => 
        w.wardNumber === wardNumber 
          ? { ...w, file, records, status: 'uploaded' as const, fileName: file.name }
          : w
      ));
      toast.success(`${records.length} records loaded for Ward ${wardNumber}`);
    } catch (error) {
      console.error('File parsing error:', error);
      setWardsToUpload(prev => prev.map(w => 
        w.wardNumber === wardNumber 
          ? { ...w, file, records: [], status: 'error' as const }
          : w
      ));
      toast.error(`Failed to parse ${file.name}`);
    } finally {
      setUploadingIndex(null);
    }
  }, [wardsToUpload]);

  const handleFileInput = useCallback((wardNumber: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(wardNumber, file);
    }
    e.target.value = '';
  }, [handleFileUpload]);

  const handleSave = () => {
    const uploadedWards = wardsToUpload.filter(w => w.status === 'uploaded' && w.records.length > 0);
    
    uploadedWards.forEach(ward => {
      const wardData: WardData = {
        id: crypto.randomUUID(),
        name: `Ward ${ward.wardNumber}`,
        municipality: municipalityName,
        voters: ward.records.map(record => {
          // Use surname from parsed data if available, otherwise extract from name
          const surnameFromRecord = record.surname?.trim();
          const surnameFromName = record.voterName.split(' ').pop() || '';
          const surname = surnameFromRecord || surnameFromName;
          
          // Use voterId from Excel/parsed data, fallback to UUID only if missing
          const voterIdFromRecord = record.voterId?.toString().trim();
          const voterId = voterIdFromRecord && voterIdFromRecord !== '' ? voterIdFromRecord : crypto.randomUUID();
          
          return {
            id: voterId,
            municipality: municipalityName,
            ward: `Ward ${ward.wardNumber}`,
            fullName: record.voterName,
            age: record.age,
            gender: record.gender,
            caste: record.caste || '',
            surname: surname,
            isNewar: isNewarName(record.voterName),
            originalData: record.originalData
          };
        }),
        uploadedAt: new Date(),
        fileName: ward.fileName || ''
      };
      addWardData(municipalityName, wardData);
    });

    toast.success(`${uploadedWards.length} ward(s) added to ${municipalityName}`);

    setWardsToUpload([]);
    onOpenChange(false);
  };

  const uploadedCount = wardsToUpload.filter(w => w.status === 'uploaded').length;

  // Get suggested ward numbers (gaps in existing wards)
  const maxExisting = Math.max(...existingWardNumbers, 0);
  const suggestedWards = [];
  for (let i = 1; i <= maxExisting + 5; i++) {
    if (!existingWardNumbers.includes(i) && !wardsToUpload.some(w => w.wardNumber === i)) {
      suggestedWards.push(i);
      if (suggestedWards.length >= 5) break;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('upload.addWardData')} - {municipalityName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Wards Info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">
              {t('upload.existingWards')}: 
            </p>
            <div className="flex flex-wrap gap-1.5">
              {existingWardNumbers.sort((a, b) => a - b).map(num => (
                <Badge key={num} variant="secondary" className="text-xs">
                  Ward {num}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick Add Suggested Wards */}
          {suggestedWards.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('upload.quickAddWards')}:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedWards.map(num => (
                  <Button
                    key={num}
                    variant="outline"
                    size="sm"
                    onClick={() => addWardSlot(num)}
                    className="gap-1"
                  >
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

          {/* Wards to Upload */}
          {wardsToUpload.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t('upload.wardsToUpload')}:</p>
                <Badge variant="outline">{uploadedCount} / {wardsToUpload.length} ready</Badge>
              </div>
              
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {wardsToUpload.map((ward, index) => (
                    <div
                      key={ward.wardNumber}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-3 transition-all',
                        ward.status === 'uploaded' && 'border-success/30 bg-success/5',
                        ward.status === 'error' && 'border-destructive/30 bg-destructive/5',
                        ward.status === 'pending' && 'border-border hover:border-accent/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded font-semibold text-sm',
                          ward.status === 'uploaded' ? 'bg-success/20 text-success' :
                          ward.status === 'error' ? 'bg-destructive/20 text-destructive' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {ward.wardNumber}
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">Ward {ward.wardNumber}</p>
                          {ward.status === 'uploaded' && ward.fileName && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <FileSpreadsheet className="h-3 w-3" />
                              {ward.fileName} • {ward.records.length} records
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {uploadingIndex === index ? (
                          <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        ) : ward.status === 'uploaded' ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : ward.status === 'error' ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <label className="cursor-pointer">
                            <Button variant="outline" size="sm" className="gap-1.5" asChild>
                              <span>
                                <Upload className="h-3.5 w-3.5" />
                                Upload
                              </span>
                            </Button>
                            <input
                              type="file"
                              accept={getSupportedFormats()}
                              onChange={(e) => handleFileInput(ward.wardNumber, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeWardSlot(ward.wardNumber)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {t('upload.supportedFormats')}: {getSupportedFormatsText()}
            </p>
            <Button 
              onClick={handleSave} 
              disabled={uploadedCount === 0}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t('upload.saveWards')} ({uploadedCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

