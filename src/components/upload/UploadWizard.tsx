import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData } from '@/contexts/VoterDataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Database, Building2, FolderPlus, ChevronDown, ChevronRight, FileText, MapPin, Table, LayoutDashboard } from 'lucide-react';
import { VoterDataTable } from '@/components/data/VoterDataTable';
import { DashboardUploadWizard } from './DashboardUploadWizard';
import { AddWardDialog } from './AddWardDialog';
import { DeleteDataDialog } from './DeleteDataDialog';
import { ExplorerBoothManager } from './ExplorerBoothManager';
import { ParsedRecord } from '@/lib/fileParser';
import { cn } from '@/lib/utils';

interface WardUploadData {
  wardNumber: number;
  file: File | null;
  records: ParsedRecord[];
  status: 'pending' | 'uploaded' | 'error';
  fileName?: string;
}

export const UploadWizard = () => {
  const { t } = useLanguage();
  const { municipalities, getWardVoters } = useVoterData();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [addWardDialogOpen, setAddWardDialogOpen] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [selectedWardIndex, setSelectedWardIndex] = useState(0);
  const [expandedMunicipalities, setExpandedMunicipalities] = useState<string[]>(
    municipalities.length > 0 ? [municipalities[0].id] : []
  );
  const [expandedWards, setExpandedWards] = useState<string[]>([]);

  const toggleMunicipalityExpand = (id: string) => {
    setExpandedMunicipalities((prev) =>
    prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const toggleWardExpand = (id: string) => {
    setExpandedWards((prev) =>
    prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  // Get current municipality for "Add Ward" dialog
  const currentMunicipalityId = selectedMunicipality || municipalities[0]?.id;
  const currentMunicipalityData = municipalities.find((m) => m.id === currentMunicipalityId);
  const existingWardNumbers = currentMunicipalityData?.wards.map((w) => {
    const match = w.name.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }).filter((n) => n > 0) || [];

  // Convert municipality data to WardUploadData format for VoterDataTable
  const getWardDataForMunicipality = (municipalityId: string): WardUploadData[] => {
    const municipality = municipalities.find((m) => m.id === municipalityId);
    if (!municipality) return [];

    return municipality.wards.map((ward) => {
      // Extract actual ward number from name (e.g., "Ward 3" -> 3)
      const match = ward.name.match(/\d+/);
      const wardNumber = match ? parseInt(match[0]) : 1;

      // Use getWardVoters to properly aggregate voters from booth centres
      const voters = getWardVoters(ward);

      return {
        wardNumber,
        file: null,
        records: voters.map((voter) => ({
          wardNo: voter.ward,
          centerName: '',
          voterId: voter.id,
          voterName: voter.fullName,
          age: voter.age,
          gender: voter.gender,
          spouse: '',
          parents: '',
          surname: voter.surname,
          originalData: voter.originalData
        })) as ParsedRecord[],
        status: 'uploaded' as const,
        fileName: ward.fileName
      };
    });
  };

  const currentMunicipality = municipalities.find((m) => m.id === selectedMunicipality);

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
      </Card>);

  }

  return (
    <div className="flex gap-6">
      {/* Windows-style File Explorer Sidebar */}
      <Card className="w-64 shrink-0 card-shadow border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Explorer
            </h3>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Add Municipality">
                  <Plus className="h-4 w-4" />
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

          <div className="space-y-1">
            {municipalities.map((municipality) =>
            <Collapsible
              key={municipality.id}
              open={expandedMunicipalities.includes(municipality.id)}
              onOpenChange={() => toggleMunicipalityExpand(municipality.id)}>

                <div className="group flex items-center">
                  <CollapsibleTrigger asChild>
                    <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex-1 justify-start gap-1.5 h-8 px-2 text-sm font-medium",
                      selectedMunicipality === municipality.id && "bg-accent"
                    )}
                    onClick={() => setSelectedMunicipality(municipality.id)}>

                      {expandedMunicipalities.includes(municipality.id) ?
                    <ChevronDown className="h-4 w-4 shrink-0" /> :
                    <ChevronRight className="h-4 w-4 shrink-0" />
                    }
                      <Building2 className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{municipality.name}</span>
                      <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">
                        {municipality.wards.length}
                      </Badge>
                    </Button>
                  </CollapsibleTrigger>
                  <DeleteDataDialog
                  type="municipality"
                  municipality={municipality} />

                </div>

                <CollapsibleContent className="pl-4">
                  {municipality.wards.map((ward, idx) =>
                <Collapsible
                  key={ward.id}
                  open={expandedWards.includes(ward.id)}
                  onOpenChange={() => toggleWardExpand(ward.id)}>

                      <div className="group flex items-center">
                        <CollapsibleTrigger asChild>
                          <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "flex-1 justify-start gap-1.5 h-7 px-2 text-sm",
                          selectedMunicipality === municipality.id && selectedWardIndex === idx && "bg-accent"
                        )}
                        onClick={() => {
                          setSelectedMunicipality(municipality.id);
                          setSelectedWardIndex(idx);
                        }}>

                            {expandedWards.includes(ward.id) ?
                        <ChevronDown className="h-3 w-3 shrink-0" /> :
                        <ChevronRight className="h-3 w-3 shrink-0" />
                        }
                            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{ward.name}</span>
                            {(ward.boothCentres?.length || 0) > 0 &&
                        <Badge variant="outline" className="text-[10px] h-4 px-1 gap-0.5">
                                <MapPin className="h-2.5 w-2.5" />
                                {ward.boothCentres?.length}
                              </Badge>
                        }
                            <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1">
                              {ward.voters.length}
                            </Badge>
                          </Button>
                        </CollapsibleTrigger>
                        <DeleteDataDialog
                      type="ward"
                      municipality={municipality}
                      ward={ward} />

                      </div>
                      <CollapsibleContent className="pl-6">
                        <ExplorerBoothManager
                      municipalityId={municipality.id}
                      municipalityName={municipality.name}
                      wardId={ward.id}
                      wardName={ward.name}
                      boothCentres={ward.boothCentres || []} />

                      </CollapsibleContent>
                    </Collapsible>
                )}
                  
                  {/* Add Ward Button */}
                  <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-1.5 h-7 px-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSelectedMunicipality(municipality.id);
                    setAddWardDialogOpen(true);
                  }}>

                    <FolderPlus className="h-3.5 w-3.5 shrink-0" />
                    <span>Add Ward...</span>
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-4">
        <Tabs defaultValue="table-view" className="w-full">
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="table-view" className="gap-1.5">
              <Table className="h-4 w-4" />
              Table View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card className="card-shadow border-border/50">
              <CardContent className="p-6">
                {(() => {
                  const muni = currentMunicipalityData || municipalities[0];
                  if (!muni) return null;
                  const wardData = getWardDataForMunicipality(muni.id);
                  const totalVoters = wardData.reduce((sum, w) => sum + w.records.length, 0);
                  const uploadedWards = wardData.filter((w) => w.records.length > 0).length;
                  return (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">{muni.name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-2xl font-bold text-foreground">{wardData.length}</p>
                          <p className="text-xs text-muted-foreground">Total Wards</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-2xl font-bold text-foreground">{uploadedWards}</p>
                          <p className="text-xs text-muted-foreground">Wards with Data</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-2xl font-bold text-foreground">{totalVoters.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Voters</p>
                        </div>
                      </div>
                    </div>);

                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table-view" className="mt-4">
            {currentMunicipalityData ?
            <VoterDataTable
              wards={getWardDataForMunicipality(currentMunicipalityData.id)}
              municipalityName={currentMunicipalityData.name}
              selectedWardIndex={selectedWardIndex}
              onWardSelect={setSelectedWardIndex}
              onUploadMore={() => setUploadDialogOpen(true)} /> :
            municipalities.length > 0 ?
            <VoterDataTable
              wards={getWardDataForMunicipality(municipalities[0].id)}
              municipalityName={municipalities[0].name}
              selectedWardIndex={selectedWardIndex}
              onWardSelect={setSelectedWardIndex}
              onUploadMore={() => setUploadDialogOpen(true)} /> :
            null}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Ward Dialog */}
      {currentMunicipalityData &&
      <AddWardDialog
        open={addWardDialogOpen}
        onOpenChange={setAddWardDialogOpen}
        municipalityId={currentMunicipalityData.id}
        municipalityName={currentMunicipalityData.name}
        existingWardNumbers={existingWardNumbers} />

      }
    </div>);

};