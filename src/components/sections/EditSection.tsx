import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData, VoterRecord } from '@/contexts/VoterDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Edit3, Undo2, Save, Search, X, FolderOpen, ChevronRight, 
  Users, UserPlus, FileText, Building2, Plus, Filter 
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { detectCasteFromName } from '@/lib/casteData';

const OCCUPATIONS = [
  'Agriculture', 'Business', 'Government Service', 'Private Job', 'Teacher',
  'Doctor', 'Engineer', 'Lawyer', 'Student', 'Homemaker', 'Retired', 'Other'
];

const POLITICAL_PARTIES = [
  { name: 'Nepali Congress', short: 'NC' },
  { name: 'CPN-UML', short: 'UML' },
  { name: 'CPN-Maoist', short: 'Maoist' },
  { name: 'Rastriya Swatantra Party', short: 'RSP' },
  { name: 'Rastriya Prajatantra Party', short: 'RPP' },
  { name: 'Janata Samajwadi Party', short: 'JSP' },
  { name: 'Independent', short: 'IND' },
  { name: 'None', short: '-' },
];

const NOTE_TAGS = [
  'Supporter', 'Volunteer', 'Donor', 'Inactive', 'New Voter', 'Senior Citizen',
  'Youth Leader', 'Requires Follow-up', 'Key Contact', 'Community Leader'
];

export const EditSection = () => {
  const { t, getBilingual } = useLanguage();
  const { municipalities, updateVoterRecord, revertVoterRecord } = useVoterData();
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVoter, setEditingVoter] = useState<VoterRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<VoterRecord> & {
    tole?: string;
    occupation?: string;
    partyAffiliations?: string[];
    notes?: string[];
    customNote?: string;
    familyMemberIds?: string[];
    isMainFamilyMember?: boolean;
  }>({});
  const [showOriginalData, setShowOriginalData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const currentMunicipality = municipalities.find(m => m.id === selectedMunicipality);
  const currentWard = currentMunicipality?.wards.find(w => w.id === selectedWard);
  
  // Get all voters in the current ward for family member selection
  const allWardVoters = currentWard?.voters || [];
  
  const voters = useMemo(() => {
    return allWardVoters.filter(v => 
      v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.caste.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allWardVoters, searchTerm]);

  const paginatedVoters = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return voters.slice(start, start + pageSize);
  }, [voters, currentPage]);

  const totalPages = Math.ceil(voters.length / pageSize);

  // Get unique toles from the data
  const uniqueToles = useMemo(() => {
    const toles = new Set<string>();
    allWardVoters.forEach(v => {
      if (v.originalData?.['Tole'] || v.originalData?.['टोल']) {
        toles.add(v.originalData['Tole'] || v.originalData['टोल']);
      }
    });
    return Array.from(toles).sort();
  }, [allWardVoters]);

  // Auto-select municipality if only one exists
  const autoSelectedMunicipality = municipalities.length === 1 ? municipalities[0] : null;
  const effectiveMunicipality = selectedMunicipality 
    ? currentMunicipality 
    : autoSelectedMunicipality;

  const handleEditClick = (voter: VoterRecord) => {
    setEditingVoter(voter);
    const detected = detectCasteFromName(voter.fullName);
    setEditForm({
      fullName: voter.fullName,
      age: voter.age,
      gender: voter.gender,
      caste: voter.caste || detected.caste,
      surname: voter.surname || detected.surname,
      phone: voter.phone,
      email: voter.email,
      tole: voter.originalData?.['Tole'] || voter.originalData?.['टोल'] || '',
      occupation: '',
      partyAffiliations: [],
      notes: [],
      customNote: '',
      familyMemberIds: [],
      isMainFamilyMember: false,
    });
    setShowOriginalData(false);
  };

  const handleSaveEdit = () => {
    if (!editingVoter || !effectiveMunicipality || !selectedWard) return;

    updateVoterRecord(effectiveMunicipality.id, selectedWard, editingVoter.id, editForm);
    toast.success('Record updated successfully');
    setEditingVoter(null);
    setEditForm({});
  };

  const handleRevert = (voterId: string) => {
    if (!effectiveMunicipality || !selectedWard) return;
    revertVoterRecord(effectiveMunicipality.id, selectedWard, voterId);
    toast.success('Last change reverted');
  };

  const togglePartyAffiliation = (partyName: string) => {
    setEditForm(prev => ({
      ...prev,
      partyAffiliations: prev.partyAffiliations?.includes(partyName)
        ? prev.partyAffiliations.filter(p => p !== partyName)
        : [...(prev.partyAffiliations || []), partyName]
    }));
  };

  const toggleNote = (note: string) => {
    setEditForm(prev => ({
      ...prev,
      notes: prev.notes?.includes(note)
        ? prev.notes.filter(n => n !== note)
        : [...(prev.notes || []), note]
    }));
  };

  const toggleFamilyMember = (memberId: string) => {
    setEditForm(prev => ({
      ...prev,
      familyMemberIds: prev.familyMemberIds?.includes(memberId)
        ? prev.familyMemberIds.filter(id => id !== memberId)
        : [...(prev.familyMemberIds || []), memberId]
    }));
  };

  // Available family members (exclude already selected and current voter)
  const availableFamilyMembers = allWardVoters.filter(v => 
    v.id !== editingVoter?.id && 
    !editForm.familyMemberIds?.includes(v.id)
  );

  // Get bilingual labels
  const nameLabels = getBilingual('table.name');
  const ageLabels = getBilingual('table.age');
  const genderLabels = getBilingual('table.gender');

  return (
    <div className="space-y-6">
      {/* Folder-like Navigation */}
      <Card className="card-shadow border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FolderOpen className="h-4 w-4 text-accent" />
            {t('edit.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {effectiveMunicipality?.name || 'Select Municipality'}
            </span>
            {selectedWard && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {currentWard?.name}
                </span>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Municipality Selection - Only show if multiple exist */}
            {municipalities.length > 1 && (
              <div className="space-y-2">
                <Label>{t('common.municipality')}</Label>
                <Select 
                  value={selectedMunicipality} 
                  onValueChange={(v) => { setSelectedMunicipality(v); setSelectedWard(''); setCurrentPage(1); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Municipality" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipalities.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Ward Selection - Show if municipality is selected/auto-selected */}
            {effectiveMunicipality && (
              <div className="space-y-2">
                <Label>{t('common.ward')}</Label>
                <Select value={selectedWard} onValueChange={(v) => { setSelectedWard(v); setCurrentPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('edit.selectWard')} />
                  </SelectTrigger>
                  <SelectContent>
                    {effectiveMunicipality.wards.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          {w.name}
                          <Badge variant="secondary" className="ml-2">
                            {w.voters.length}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search */}
            {selectedWard && (
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, surname..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-9"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      {selectedWard && currentWard ? (
        <Card className="card-shadow border-border/50">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base font-semibold">
              <div className="flex items-center gap-2">
                <span>{currentWard.name} - {effectiveMunicipality?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{voters.length} records</Badge>
                {searchTerm && (
                  <Badge variant="outline">Filtered</Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] sticky left-0 bg-background z-10">
                        <div>{t('table.sn')}</div>
                        <div className="text-xs text-muted-foreground">क्र.सं.</div>
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        <div>{t('table.voterId')}</div>
                        <div className="text-xs text-muted-foreground">मतदाता नं.</div>
                      </TableHead>
                      <TableHead className="min-w-[180px]">
                        <div>{nameLabels.en}</div>
                        <div className="text-xs text-muted-foreground">{nameLabels.ne}</div>
                      </TableHead>
                      <TableHead className="w-[60px]">
                        <div>{ageLabels.en}</div>
                        <div className="text-xs text-muted-foreground">{ageLabels.ne}</div>
                      </TableHead>
                      <TableHead className="w-[80px]">
                        <div>{genderLabels.en}</div>
                        <div className="text-xs text-muted-foreground">{genderLabels.ne}</div>
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        <div>Caste</div>
                        <div className="text-xs text-muted-foreground">जात</div>
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        <div>Surname</div>
                        <div className="text-xs text-muted-foreground">थर</div>
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        <div>Father's Name</div>
                        <div className="text-xs text-muted-foreground">बाबुको नाम</div>
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        <div>Tole</div>
                        <div className="text-xs text-muted-foreground">टोल</div>
                      </TableHead>
                      <TableHead className="w-[80px]">Status</TableHead>
                      <TableHead className="text-right sticky right-0 bg-background z-10 w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVoters.map((voter, index) => {
                      const detected = detectCasteFromName(voter.fullName);
                      const fatherName = voter.originalData?.['Father Name'] || 
                                        voter.originalData?.['बाबुको नाम'] || 
                                        voter.originalData?.['बुबाको नाम'] || 
                                        '-';
                      const tole = voter.originalData?.['Tole'] || 
                                   voter.originalData?.['टोल'] || 
                                   voter.originalData?.['ठेगाना'] || 
                                   '-';
                      const voterNo = voter.originalData?.['मतदाता नं'] || 
                                      voter.originalData?.['Voter No'] || 
                                      voter.originalData?.['क्र.सं.'] ||
                                      voter.originalData?.['SN'] ||
                                      voter.id.slice(0, 8);
                      
                      return (
                        <TableRow key={voter.id} className={voter.isEdited ? 'bg-warning/5' : ''}>
                          <TableCell className="font-mono text-sm text-muted-foreground sticky left-0 bg-background z-10">
                            {(currentPage - 1) * pageSize + index + 1}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium">
                            {voterNo}
                          </TableCell>
                          <TableCell className="font-medium">{voter.fullName}</TableCell>
                          <TableCell>{voter.age}</TableCell>
                          <TableCell className="capitalize">{voter.gender}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {voter.caste || detected.caste}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{voter.surname || detected.surname}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fatherName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{tole}</TableCell>
                          <TableCell>
                            {voter.isEdited ? (
                              <Badge variant="outline" className="border-warning/50 text-warning text-xs">
                                Edited
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Original</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right sticky right-0 bg-background z-10">
                            <div className="flex justify-end gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => handleEditClick(voter)}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Edit3 className="h-5 w-5" />
                                    {t('edit.voterRecord')}
                                  </DialogTitle>
                                </DialogHeader>
                                
                                <ScrollArea className="flex-1 pr-4">
                                  <Tabs defaultValue="basic" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4 mb-4">
                                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                      <TabsTrigger value="family">Family</TabsTrigger>
                                      <TabsTrigger value="party">Party</TabsTrigger>
                                      <TabsTrigger value="notes">Notes</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="basic" className="space-y-4">
                                      {/* Show Original Data Toggle */}
                                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm">{t('edit.originalData')}</span>
                                        </div>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => setShowOriginalData(!showOriginalData)}
                                        >
                                          {showOriginalData ? 'Hide' : 'Show'}
                                        </Button>
                                      </div>

                                      {showOriginalData && editingVoter && (
                                        <div className="p-4 rounded-lg bg-muted/30 border border-border">
                                          <p className="text-sm font-medium mb-2">Original File Data:</p>
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            {Object.entries(editingVoter.originalData).map(([key, value]) => (
                                              <div key={key} className="flex justify-between gap-2">
                                                <span className="text-muted-foreground">{key}:</span>
                                                <span className="font-medium truncate">{value}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Basic Fields */}
                                      <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                          <Label>Full Name</Label>
                                          <Input
                                            value={editForm.fullName || ''}
                                            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Age</Label>
                                          <Input
                                            type="number"
                                            value={editForm.age || ''}
                                            onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) })}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Gender</Label>
                                          <Select 
                                            value={editForm.gender} 
                                            onValueChange={(v) => setEditForm({ ...editForm, gender: v as any })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="male">Male</SelectItem>
                                              <SelectItem value="female">Female</SelectItem>
                                              <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Caste</Label>
                                          <Input
                                            value={editForm.caste || ''}
                                            onChange={(e) => setEditForm({ ...editForm, caste: e.target.value })}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Surname</Label>
                                          <Input
                                            value={editForm.surname || ''}
                                            onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>{t('edit.tole')}</Label>
                                          <Select 
                                            value={editForm.tole} 
                                            onValueChange={(v) => setEditForm({ ...editForm, tole: v })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select Tole" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {uniqueToles.map(tole => (
                                                <SelectItem key={tole} value={tole}>{tole}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>{t('edit.occupation')}</Label>
                                          <Select 
                                            value={editForm.occupation} 
                                            onValueChange={(v) => setEditForm({ ...editForm, occupation: v })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select Occupation" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {OCCUPATIONS.map(occ => (
                                                <SelectItem key={occ} value={occ}>{occ}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Phone</Label>
                                          <Input
                                            value={editForm.phone || ''}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                          />
                                        </div>
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="family" className="space-y-4">
                                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                        <Checkbox 
                                          checked={editForm.isMainFamilyMember}
                                          onCheckedChange={(checked) => setEditForm({ ...editForm, isMainFamilyMember: !!checked })}
                                        />
                                        <Label>{t('edit.mainMember')}</Label>
                                      </div>

                                      {/* Selected Family Members */}
                                      {(editForm.familyMemberIds?.length || 0) > 0 && (
                                        <div className="space-y-2">
                                          <Label>{t('edit.familyMembers')} ({editForm.familyMemberIds?.length})</Label>
                                          <div className="flex flex-wrap gap-2">
                                            {editForm.familyMemberIds?.map(id => {
                                              const member = allWardVoters.find(v => v.id === id);
                                              return member ? (
                                                <Badge key={id} variant="secondary" className="gap-1">
                                                  {member.fullName}
                                                  <X 
                                                    className="h-3 w-3 cursor-pointer" 
                                                    onClick={() => toggleFamilyMember(id)}
                                                  />
                                                </Badge>
                                              ) : null;
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Add Family Members */}
                                      <div className="space-y-2">
                                        <Label>{t('edit.addFamilyMember')}</Label>
                                        <ScrollArea className="h-[200px] border rounded-lg p-2">
                                          {availableFamilyMembers.slice(0, 50).map(member => (
                                            <div 
                                              key={member.id}
                                              className={cn(
                                                "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50",
                                                editForm.familyMemberIds?.includes(member.id) && "bg-accent/10"
                                              )}
                                              onClick={() => toggleFamilyMember(member.id)}
                                            >
                                              <Checkbox checked={editForm.familyMemberIds?.includes(member.id)} />
                                              <span className="text-sm">{member.fullName}</span>
                                              <span className="text-xs text-muted-foreground">({member.age})</span>
                                            </div>
                                          ))}
                                        </ScrollArea>
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="party" className="space-y-4">
                                      <div className="space-y-2">
                                        <Label>{t('edit.partyAffiliation')} (Multi-select)</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                          {POLITICAL_PARTIES.map(party => (
                                            <div
                                              key={party.name}
                                              className={cn(
                                                "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                                                editForm.partyAffiliations?.includes(party.name)
                                                  ? "border-accent bg-accent/10"
                                                  : "border-border hover:border-muted-foreground/50"
                                              )}
                                              onClick={() => togglePartyAffiliation(party.name)}
                                            >
                                              <Checkbox checked={editForm.partyAffiliations?.includes(party.name)} />
                                              <div>
                                                <p className="text-sm font-medium">{party.name}</p>
                                                <p className="text-xs text-muted-foreground">{party.short}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="notes" className="space-y-4">
                                      <div className="space-y-2">
                                        <Label>{t('edit.notes')} (Multi-select)</Label>
                                        <div className="flex flex-wrap gap-2">
                                          {NOTE_TAGS.map(note => (
                                            <Badge
                                              key={note}
                                              variant={editForm.notes?.includes(note) ? "default" : "outline"}
                                              className="cursor-pointer"
                                              onClick={() => toggleNote(note)}
                                            >
                                              {note}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Custom Note</Label>
                                        <Textarea
                                          value={editForm.customNote || ''}
                                          onChange={(e) => setEditForm({ ...editForm, customNote: e.target.value })}
                                          placeholder="Add a custom note..."
                                          rows={4}
                                        />
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                </ScrollArea>

                                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                                  <DialogClose asChild>
                                    <Button variant="outline">{t('common.cancel')}</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button onClick={handleSaveEdit} className="gap-2">
                                      <Save className="h-4 w-4" />
                                      {t('common.save')}
                                    </Button>
                                  </DialogClose>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {voter.isEdited && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleRevert(voter.id)}
                              >
                                <Undo2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, voters.length)} of {voters.length}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="card-shadow border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Select a Ward to Edit</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Choose a municipality and ward from above to view and edit voter records
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
