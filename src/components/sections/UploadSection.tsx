import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData, VoterRecord, WardData } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2,
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'success' | 'error';
  message?: string;
  municipality: string;
  ward: string;
}

// Newar surnames list for detection
const NEWAR_SURNAMES = [
  'shrestha', 'shakya', 'maharjan', 'dangol', 'tuladhar', 'tamrakar', 
  'manandhar', 'singh', 'amatya', 'joshi', 'pradhan', 'rajbhandari',
  'bajracharya', 'sthapit', 'ranjitkar', 'nakarmi', 'chitrakar', 'karmacharya'
];

const isNewarSurname = (surname: string): boolean => {
  return NEWAR_SURNAMES.some(s => surname.toLowerCase().includes(s));
};

const parseCSV = (content: string, municipality: string, ward: string): VoterRecord[] => {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const records: VoterRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < headers.length) continue;

    const originalData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      originalData[h] = values[idx] || '';
    });

    // Map CSV columns to VoterRecord
    const fullName = originalData['name'] || originalData['full_name'] || originalData['fullname'] || '';
    const surname = originalData['surname'] || originalData['last_name'] || originalData['lastname'] || fullName.split(' ').pop() || '';
    const ageStr = originalData['age'] || '0';
    const genderStr = (originalData['gender'] || originalData['sex'] || 'other').toLowerCase();
    const caste = originalData['caste'] || originalData['ethnicity'] || '';
    const isNewarFlag = originalData['is_newar'] || originalData['newar'];

    let isNewar = false;
    if (isNewarFlag) {
      isNewar = isNewarFlag.toLowerCase() === 'true' || isNewarFlag === '1' || isNewarFlag.toLowerCase() === 'yes';
    } else {
      isNewar = isNewarSurname(surname) || isNewarSurname(caste);
    }

    const record: VoterRecord = {
      id: crypto.randomUUID(),
      municipality,
      ward,
      fullName,
      age: parseInt(ageStr) || 0,
      gender: genderStr === 'male' || genderStr === 'm' ? 'male' 
            : genderStr === 'female' || genderStr === 'f' ? 'female' 
            : 'other',
      caste,
      surname,
      familyName: originalData['family_name'] || originalData['familyname'],
      lastName: originalData['last_name'] || originalData['lastname'],
      isNewar,
      phone: originalData['phone'] || originalData['mobile'],
      email: originalData['email'],
      socialHandles: originalData['social'] || originalData['social_handles'],
      partyName: originalData['party'] || originalData['party_name'],
      partyLogo: originalData['party_logo'],
      originalData,
    };

    records.push(record);
  }

  return records;
};

export const UploadSection = () => {
  const { t } = useLanguage();
  const { addWardData, municipalities } = useVoterData();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [newMunicipality, setNewMunicipality] = useState('');
  const [newWard, setNewWard] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFiles = useCallback(async (files: FileList, municipality: string, ward: string) => {
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.csv')) {
        newFiles.push({
          id: crypto.randomUUID(),
          file,
          status: 'error',
          message: 'Only CSV files are supported',
          municipality,
          ward
        });
        continue;
      }

      try {
        const content = await file.text();
        const records = parseCSV(content, municipality, ward);

        if (records.length === 0) {
          newFiles.push({
            id: crypto.randomUUID(),
            file,
            status: 'error',
            message: 'No valid records found in file',
            municipality,
            ward
          });
          continue;
        }

        const wardData: WardData = {
          id: crypto.randomUUID(),
          name: ward,
          municipality,
          voters: records,
          uploadedAt: new Date(),
          fileName: file.name
        };

        addWardData(municipality, wardData);

        newFiles.push({
          id: crypto.randomUUID(),
          file,
          status: 'success',
          message: `${records.length} records imported`,
          municipality,
          ward
        });

        toast.success(t('upload.success'), {
          description: `${records.length} voters added to ${ward}, ${municipality}`
        });

      } catch (error) {
        newFiles.push({
          id: crypto.randomUUID(),
          file,
          status: 'error',
          message: 'Failed to parse file',
          municipality,
          ward
        });
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, [addWardData, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!newMunicipality || !newWard) {
      toast.error('Please specify municipality and ward first');
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files, newMunicipality, newWard);
    }
  }, [newMunicipality, newWard, processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!newMunicipality || !newWard) {
      toast.error('Please specify municipality and ward first');
      return;
    }

    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files, newMunicipality, newWard);
    }
  }, [newMunicipality, newWard, processFiles]);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Municipality and Ward Selection */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t('upload.selectMunicipality')} & {t('upload.selectWard')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="municipality">{t('common.municipality')}</Label>
              <Input
                id="municipality"
                placeholder="e.g., Kathmandu"
                value={newMunicipality}
                onChange={(e) => setNewMunicipality(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ward">{t('common.ward')}</Label>
              <Input
                id="ward"
                placeholder="e.g., Ward-1"
                value={newWard}
                onChange={(e) => setNewWard(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t('upload.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all',
              dragActive 
                ? 'border-accent bg-accent/5' 
                : 'border-border hover:border-accent/50 hover:bg-muted/50',
              (!newMunicipality || !newWard) && 'opacity-50 pointer-events-none'
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-center text-sm font-medium text-foreground">
              {t('upload.dragDrop')}
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {t('upload.supportedFormats')}
            </p>
            <input
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileInput}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={!newMunicipality || !newWard}
            />
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-medium text-foreground">Uploaded Files</h4>
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-3',
                    file.status === 'success' && 'border-success/30 bg-success/5',
                    file.status === 'error' && 'border-destructive/30 bg-destructive/5',
                    file.status === 'pending' && 'border-border bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.municipality} → {file.ward}
                        {file.message && ` • ${file.message}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'success' && <CheckCircle2 className="h-5 w-5 text-success" />}
                    {file.status === 'error' && <AlertCircle className="h-5 w-5 text-destructive" />}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Municipalities */}
      {municipalities.length > 0 && (
        <Card className="card-shadow border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Uploaded Data Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {municipalities.map((municipality) => (
                <div key={municipality.id} className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold text-foreground">{municipality.name}</h4>
                  <div className="mt-3 space-y-2">
                    {municipality.wards.map((ward) => (
                      <div 
                        key={ward.id}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{ward.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({ward.voters.length} voters)
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{ward.fileName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
