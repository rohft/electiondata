import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Building2, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WardFileUploader } from './WardFileUploader';
import { WardDataViewer } from './WardDataViewer';
import { ParsedRecord } from '@/lib/fileParser';

interface WardUploadData {
  wardNumber: number;
  file: File | null;
  records: ParsedRecord[];
  status: 'pending' | 'uploaded' | 'error';
  fileName?: string;
}

export interface MunicipalityUploadData {
  name: string;
  wardCount: number;
  wards: WardUploadData[];
}

export const UploadWizard = () => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [municipalityName, setMunicipalityName] = useState('');
  const [wardCount, setWardCount] = useState<number | ''>('');
  const [wardsData, setWardsData] = useState<WardUploadData[]>([]);
  const [selectedWardIndex, setSelectedWardIndex] = useState(0);

  const totalSteps = 4;
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

  const uploadedWardsCount = wardsData.filter(w => w.status === 'uploaded').length;
  const canProceedToView = uploadedWardsCount > 0;

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <Building2 className="h-5 w-5" />
              <span className="text-sm">{t('upload.step')} 1 of {totalSteps}</span>
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
                Enter the name of the municipality you want to analyze
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <Hash className="h-5 w-5" />
              <span className="text-sm">{t('upload.step')} 2 of {totalSteps}</span>
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
                Enter the total number of wards in {municipalityName || 'the municipality'}
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                {t('upload.step')} 3 of {totalSteps} • Upload files for each ward
              </span>
              <span className="text-sm font-medium text-accent">
                {uploadedWardsCount} / {wardsData.length} wards uploaded
              </span>
            </div>
            
            <WardFileUploader
              wards={wardsData}
              municipalityName={municipalityName}
              onWardDataUpdate={handleWardDataUpdate}
            />
          </div>
        );

      case 4:
        return (
          <WardDataViewer
            wards={wardsData}
            municipalityName={municipalityName}
            selectedWardIndex={selectedWardIndex}
            onWardSelect={setSelectedWardIndex}
          />
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return municipalityName.trim().length > 0;
      case 2:
        return typeof wardCount === 'number' && wardCount >= 1;
      case 3:
        return canProceedToView;
      default:
        return true;
    }
  };

  return (
    <Card className="card-shadow border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>{t('upload.title')}</span>
          {step < 4 && (
            <span className="text-sm font-normal text-muted-foreground">
              {municipalityName && `${municipalityName}`}
              {typeof wardCount === 'number' && wardCount > 0 && ` • ${wardCount} wards`}
            </span>
          )}
        </CardTitle>
        {step < 4 && (
          <Progress value={progress} className="h-1 mt-2" />
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStepContent()}

        {step < 4 && (
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
            
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {step === 3 ? t('upload.viewData') : t('common.next')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
