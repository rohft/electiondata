import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Database, Building2 } from 'lucide-react';
import { VoterDataTable } from '@/components/data/VoterDataTable';
import { DashboardUploadWizard } from './DashboardUploadWizard';
import { ParsedRecord } from '@/lib/fileParser';
import { isNewarName } from '@/lib/surnameUtils';

interface WardUploadData {
  wardNumber: number;
  file: File | null;
  records: ParsedRecord[];
  status: 'pending' | 'uploaded' | 'error';
  fileName?: string;
}

export const UploadWizard = () => {
  const { t } = useLanguage();
  const { municipalities } = useVoterData();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [selectedWardIndex, setSelectedWardIndex] = useState(0);

  // Convert municipality data to WardUploadData format for VoterDataTable
  const getWardDataForMunicipality = (municipalityId: string): WardUploadData[] => {
    const municipality = municipalities.find(m => m.id === municipalityId);
    if (!municipality) return [];
    
    return municipality.wards.map((ward, idx) => ({
      wardNumber: idx + 1,
      file: null,
      records: ward.voters.map(voter => ({
        wardNo: voter.ward,
        centerName: '',
        voterId: voter.id,
        voterName: voter.fullName,
        age: voter.age,
        gender: voter.gender,
        spouse: '',
        parents: '',
        originalData: voter.originalData
      })) as ParsedRecord[],
      status: 'uploaded' as const,
      fileName: ward.fileName
    }));
  };

  const currentMunicipality = municipalities.find(m => m.id === selectedMunicipality);

  // If no municipalities, show empty state
  if (municipalities.length === 0) {
    return (
      <Card className="card-shadow border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">{t('upload.noData')}</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground max-w-md">
            {t('upload.noDataDescription')}
          </p>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                {t('upload.uploadData')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('upload.title')}</DialogTitle>
              </DialogHeader>
              <DashboardUploadWizard onComplete={() => setUploadDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Municipality Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs 
          value={selectedMunicipality || municipalities[0]?.id} 
          onValueChange={id => {
            setSelectedMunicipality(id);
            setSelectedWardIndex(0);
          }}
          className="w-full"
        >
          <div className="flex items-center justify-between gap-4">
            <TabsList className="h-auto flex-wrap">
              {municipalities.map(m => (
                <TabsTrigger 
                  key={m.id} 
                  value={m.id}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  {m.name}
                  <Badge variant="secondary" className="ml-1">
                    {m.wards.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  {t('upload.addMunicipality')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('upload.title')}</DialogTitle>
                </DialogHeader>
                <DashboardUploadWizard onComplete={() => setUploadDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {municipalities.map(m => (
            <TabsContent key={m.id} value={m.id} className="mt-6">
              <VoterDataTable
                wards={getWardDataForMunicipality(m.id)}
                municipalityName={m.name}
                selectedWardIndex={selectedWardIndex}
                onWardSelect={setSelectedWardIndex}
                onUploadMore={() => setUploadDialogOpen(true)}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};
