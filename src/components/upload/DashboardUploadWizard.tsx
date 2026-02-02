import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Building2, Hash, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WardFileUploader } from './WardFileUploader';
import { parseFile, ParsedRecord } from '@/lib/fileParser';
import { toast } from '@/components/ui/use-toast';
import { isNewarName } from '@/lib/surnameUtils';

interface WardUploadData {
  wardNumber: number;
  file: File | null;
  records: ParsedRecord[];
  status: 'pending' | 'uploaded' | 'error';
  fileName?: string;
}

interface DashboardUploadWizardProps {
  onComplete: () => void;
}

export const DashboardUploadWizard = ({ onComplete }: DashboardUploadWizardProps) => {
  const { t } = useLanguage();
  const { addWardData } = useVoterData();
  const [step, setStep] = useState(1);
  const [municipalityName, setMunicipalityName] = useState('');
  const [wardCount, setWardCount] = useState<number | ''>('');
  const [wardsData, setWardsData] = useState<WardUploadData[]>([]);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const initializeWards = () => {
    if (typeof wardCount !== 'number' || wardCount < 1) return;
    
    const newWards: WardUploadData[] = [];
    for (let i = 1; i <= wardCount; i++) {
      newWards.push({
        wardNumber: i,
        file: null,
        records: [],
        status: 'pending'
      });
    }
    setWardsData(newWards);
  };

  const handleNext = () => {
    if (step === 2) {
      initializeWards();
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleWardDataUpdate = (wardIndex: number, file: File | null, records: ParsedRecord[], status: 'pending' | 'uploaded' | 'error') => {
    setWardsData(prev => {
      const updated = [...prev];
      updated[wardIndex] = {
        ...updated[wardIndex],
        file,
        records,
        status,
        fileName: file?.name
      };
      return updated;
    });
  };

  const handleSaveAndComplete = () => {
    // Save uploaded wards to context
    wardsData.forEach(ward => {
      if (ward.status === 'uploaded' && ward.records.length > 0) {
        addWardData(municipalityName, {
          id: crypto.randomUUID(),
          name: `Ward ${ward.wardNumber}`,
          municipality: municipalityName,
          voters: ward.records.map(record => ({
            id: crypto.randomUUID(),
            municipality: municipalityName,
            ward: `Ward ${ward.wardNumber}`,
            fullName: record.voterName,
            age: record.age,
            gender: record.gender,
            caste: '',
            surname: record.voterName.split(' ').pop() || '',
            isNewar: isNewarName(record.voterName),
            originalData: record.originalData
          })),
          uploadedAt: new Date(),
          fileName: ward.fileName || ''
        });
      }
    });

    toast({
      title: t('upload.success'),
      description: `${uploadedWardsCount} ward(s) uploaded successfully`,
    });

    onComplete();
  };

  const uploadedWardsCount = wardsData.filter(w => w.status === 'uploaded').length;
  const canProceedToSave = uploadedWardsCount > 0;

  const canProceed = () => {
    switch (step) {
      case 1:
        return municipalityName.trim().length > 0;
      case 2:
        return typeof wardCount === 'number' && wardCount >= 1;
      case 3:
        return canProceedToSave;
      default:
        return true;
    }
  };

  return (
    <div className="space-y-6">
      <Progress value={progress} className="h-1" />

      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <Building2 className="h-5 w-5" />
            <span className="text-sm">{t('upload.step')} 1 {t('common.of')} {totalSteps}</span>
          </div>
          <div className="space-y-3">
            <Label htmlFor="municipality-name" className="text-base font-medium">
              {t('upload.municipalityName')}
            </Label>
            <Input
              id="municipality-name"
              placeholder="e.g., चन्द्रागिरि or Chandragiri"
              value={municipalityName}
              onChange={(e) => setMunicipalityName(e.target.value)}
              className="text-lg py-6"
            />
            <p className="text-sm text-muted-foreground">
              {t('upload.municipalityHint')}
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <Hash className="h-5 w-5" />
            <span className="text-sm">{t('upload.step')} 2 {t('common.of')} {totalSteps}</span>
          </div>
          <div className="space-y-3">
            <Label htmlFor="ward-count" className="text-base font-medium">
              {t('upload.numberOfWards')}
            </Label>
            <Input
              id="ward-count"
              type="number"
              min={1}
              max={50}
              placeholder="e.g., 19"
              value={wardCount}
              onChange={(e) => setWardCount(e.target.value ? parseInt(e.target.value) : '')}
              className="text-lg py-6"
            />
            <p className="text-sm text-muted-foreground">
              {t('upload.wardCountHint')} {municipalityName || 'the municipality'}
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              {t('upload.step')} 3 {t('common.of')} {totalSteps} • {t('upload.uploadFilesForWards')}
            </span>
            <span className="text-sm font-medium text-accent">
              {uploadedWardsCount} / {wardsData.length} {t('upload.wardsUploaded')}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {t('upload.uploadPartialHint')}
          </p>
          
          <WardFileUploader
            wards={wardsData}
            municipalityName={municipalityName}
            onWardDataUpdate={handleWardDataUpdate}
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          className={cn(step === 1 && 'invisible')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        
        {step < 3 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {t('common.next')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSaveAndComplete}
            disabled={!canProceed()}
          >
            <Check className="h-4 w-4 mr-2" />
            {t('upload.saveAndView')}
          </Button>
        )}
      </div>
    </div>
  );
};
