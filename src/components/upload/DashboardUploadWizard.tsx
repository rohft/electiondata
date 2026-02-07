import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Building2, Hash, MapPin, Check, ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import '@/lib/surnameUtils';
import { BoothSetupStep, WardBoothConfig } from './BoothSetupStep';
import { BoothFileUploader, BoothUploadData } from './BoothFileUploader';
import { ParsedRecord } from '@/lib/fileParser';

interface DashboardUploadWizardProps {
  onComplete: () => void;
}

export const DashboardUploadWizard = ({ onComplete }: DashboardUploadWizardProps) => {
  const { t } = useLanguage();
  const { addWardData } = useVoterData();
  const [step, setStep] = useState(1);
  const [municipalityName, setMunicipalityName] = useState('');
  const [municipalityLogo, setMunicipalityLogo] = useState<string | null>(null);
  const [wardCount, setWardCount] = useState<number | ''>('');
  const [wardBooths, setWardBooths] = useState<WardBoothConfig[]>([]);
  const [boothUploads, setBoothUploads] = useState<BoothUploadData[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 4;
  const progress = step / totalSteps * 100;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: 'Error', description: 'Logo file must be less than 2MB', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => setMunicipalityLogo(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const initializeWardBooths = () => {
    if (typeof wardCount !== 'number' || wardCount < 1) return;
    setWardBooths(
      Array.from({ length: wardCount }, (_, i) => ({
        wardNumber: i + 1,
        booths: [{ id: crypto.randomUUID(), name: 'Booth 1' }]
      }))
    );
  };

  const initializeBoothUploads = () => {
    setBoothUploads(
      wardBooths.flatMap((ward) =>
      ward.booths.map((booth) => ({
        wardNumber: ward.wardNumber,
        boothId: booth.id,
        boothName: booth.name,
        file: null,
        records: [],
        status: 'pending' as const
      }))
      )
    );
  };

  const handleNext = () => {
    if (step === 2) initializeWardBooths();
    if (step === 3) initializeBoothUploads();
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleBoothDataUpdate = (
  index: number,
  file: File | null,
  records: ParsedRecord[],
  status: 'pending' | 'uploaded' | 'error') =>
  {
    setBoothUploads((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], file, records, status, fileName: file?.name };
      return updated;
    });
  };

  const handleSaveAndComplete = () => {
    wardBooths.forEach((ward) => {
      const boothCentres = ward.booths.map((booth) => {
        const uploadData = boothUploads.find(
          (b) => b.wardNumber === ward.wardNumber && b.boothId === booth.id
        );

        let voters: any[] = [];
        if (uploadData?.status === 'uploaded' && uploadData.records.length > 0) {
          voters = uploadData.records.map((record) => {
            const surnameFromRecord = record.surname?.trim();
            const surnameFromName = record.voterName.split(' ').pop() || '';
            const surname = surnameFromRecord || surnameFromName;
            const voterIdFromRecord = record.voterId?.toString().trim();
            const voterId =
            voterIdFromRecord && voterIdFromRecord !== '' ?
            voterIdFromRecord :
            crypto.randomUUID();

            return {
              id: voterId,
              municipality: municipalityName,
              ward: `Ward ${ward.wardNumber}`,
              fullName: record.voterName,
              age: record.age,
              gender: record.gender,
              surname,
              originalData: record.originalData
            };
          });
        }

        return {
          id: booth.id,
          name: booth.name,
          createdAt: new Date(),
          voters,
          fileName: uploadData?.fileName || '',
          uploadedAt: new Date()
        };
      });

      const allVoters = boothCentres.flatMap((b) => b.voters);

      addWardData(municipalityName, {
        id: crypto.randomUUID(),
        name: `Ward ${ward.wardNumber}`,
        municipality: municipalityName,
        voters: allVoters,
        uploadedAt: new Date(),
        fileName: '',
        boothCentres
      });
    });

    const uploadedBoothsCount = boothUploads.filter((b) => b.status === 'uploaded').length;
    const totalBoothCount = wardBooths.reduce((s, w) => s + w.booths.length, 0);

    toast({
      title: t('upload.success'),
      description: `${wardBooths.length} ward(s) with ${totalBoothCount} booth(s) created${
      uploadedBoothsCount > 0 ? `, ${uploadedBoothsCount} with data` : ''}`

    });

    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return municipalityName.trim().length > 0;
      case 2:
        return typeof wardCount === 'number' && wardCount >= 1;
      case 3:
        return wardBooths.every((w) => w.booths.length > 0);
      case 4:
        return true; // Upload is optional
      default:
        return true;
    }
  };

  const stepIcons = [Building2, Hash, MapPin, Check];
  const StepIcon = stepIcons[step - 1] || Building2;

  return (
    <div className="space-y-6">
      <Progress value={progress} className="h-1" />

      {/* Step 1: Municipality Name */}
      {step === 1 &&
      <div className="space-y-6">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <Building2 className="h-5 w-5" />
            <span className="text-sm">
              {t('upload.step')} 1 {t('common.of')} {totalSteps}
            </span>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Municipality Logo (Optional)</Label>
            <div className="flex items-center gap-4">
              {municipalityLogo ?
            <div className="relative">
                  <img
                src={municipalityLogo}
                alt="Municipality Logo"
                className="h-20 w-20 object-contain rounded-lg border border-border" />

                  <button
                onClick={() => setMunicipalityLogo(null)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">

                    <X className="h-3 w-3" />
                  </button>
                </div> :

            <button
              onClick={() => logoInputRef.current?.click()}
              className="h-20 w-20 rounded-lg border-2 border-dashed border-border hover:border-accent transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-accent">

                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs">Add Logo</span>
                </button>
            }
              <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden" />

              <div className="text-sm text-muted-foreground">
                <p>Upload municipality logo</p>
                <p className="text-xs">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="municipality-name" className="text-base font-medium">
              {t('upload.municipalityName')}
            </Label>
            <Input
            id="municipality-name"
            placeholder="e.g., कीर्तिपुर or Kirtipur"
            value={municipalityName}
            onChange={(e) => setMunicipalityName(e.target.value)}
            className="text-lg py-6" />

            <p className="text-sm text-muted-foreground">{t('upload.municipalityHint')}</p>
          </div>
        </div>
      }

      {/* Step 2: Ward Count */}
      {step === 2 &&
      <div className="space-y-6">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <Hash className="h-5 w-5" />
            <span className="text-sm">
              {t('upload.step')} 2 {t('common.of')} {totalSteps}
            </span>
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
            className="text-lg py-6" />

            <p className="text-sm text-muted-foreground">
              {t('upload.wardCountHint')} {municipalityName || 'the municipality'}
            </p>
          </div>
        </div>
      }

      {/* Step 3: Booth Setup */}
      {step === 3 &&
      <div className="space-y-6">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <MapPin className="h-5 w-5" />
            <span className="text-sm">
              {t('upload.step')} 3 {t('common.of')} {totalSteps} • Booth Configuration
            </span>
          </div>
          <BoothSetupStep wardBooths={wardBooths} onWardBoothsChange={setWardBooths} />
        </div>
      }

      {/* Step 4: Upload Voter Data */}
      {step === 4 &&
      <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              {t('upload.step')} 4 {t('common.of')} {totalSteps} • {t('upload.uploadFilesForWards')}
            </span>
          </div>
          <BoothFileUploader
          boothUploads={boothUploads}
          onBoothDataUpdate={handleBoothDataUpdate} />

        </div>
      }

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          className={cn(step === 1 && 'invisible')}>

          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        {step < totalSteps ?
        <Button onClick={handleNext} disabled={!canProceed()}>
            {t('common.next')}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button> :

        <Button onClick={handleSaveAndComplete}>
            <Check className="h-4 w-4 mr-2" />
            {t('upload.saveAndView')}
          </Button>
        }
      </div>
    </div>);

};