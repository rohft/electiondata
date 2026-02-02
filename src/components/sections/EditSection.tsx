import { useState } from 'react';
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
import { Edit3, Undo2, Save, Search, X } from 'lucide-react';
import { toast } from 'sonner';

export const EditSection = () => {
  const { t } = useLanguage();
  const { municipalities, updateVoterRecord, revertVoterRecord } = useVoterData();
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVoter, setEditingVoter] = useState<VoterRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<VoterRecord>>({});

  const currentMunicipality = municipalities.find(m => m.id === selectedMunicipality);
  const currentWard = currentMunicipality?.wards.find(w => w.id === selectedWard);
  
  const voters = currentWard?.voters.filter(v => 
    v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.caste.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEditClick = (voter: VoterRecord) => {
    setEditingVoter(voter);
    setEditForm({
      fullName: voter.fullName,
      age: voter.age,
      gender: voter.gender,
      caste: voter.caste,
      surname: voter.surname,
      phone: voter.phone,
      email: voter.email,
    });
  };

  const handleSaveEdit = () => {
    if (!editingVoter || !selectedMunicipality || !selectedWard) return;

    updateVoterRecord(selectedMunicipality, selectedWard, editingVoter.id, editForm);
    toast.success('Record updated successfully');
    setEditingVoter(null);
    setEditForm({});
  };

  const handleRevert = (voterId: string) => {
    if (!selectedMunicipality || !selectedWard) return;
    revertVoterRecord(selectedMunicipality, selectedWard, voterId);
    toast.success('Last change reverted');
  };

  return (
    <div className="space-y-6">
      {/* Selection */}
      <Card className="card-shadow border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Edit3 className="h-4 w-4 text-accent" />
            Select Data to Edit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('common.municipality')}</Label>
              <Select value={selectedMunicipality} onValueChange={(v) => { setSelectedMunicipality(v); setSelectedWard(''); }}>
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
            <div className="space-y-2">
              <Label>{t('common.ward')}</Label>
              <Select value={selectedWard} onValueChange={setSelectedWard} disabled={!currentMunicipality}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Ward" />
                </SelectTrigger>
                <SelectContent>
                  {currentMunicipality?.wards.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, surname, caste..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      {currentWard ? (
        <Card className="card-shadow border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span>{currentWard.name} - {currentMunicipality?.name}</span>
              <Badge variant="secondary">{voters.length} records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Caste</TableHead>
                    <TableHead>Surname</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voters.slice(0, 50).map((voter) => (
                    <TableRow key={voter.id}>
                      <TableCell className="font-medium">{voter.fullName}</TableCell>
                      <TableCell>{voter.age}</TableCell>
                      <TableCell className="capitalize">{voter.gender}</TableCell>
                      <TableCell>{voter.caste}</TableCell>
                      <TableCell>{voter.surname}</TableCell>
                      <TableCell>
                        {voter.isEdited ? (
                          <Badge variant="outline" className="border-warning/50 text-warning">
                            Edited
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Original</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleEditClick(voter)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Voter Record</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
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
                                    <Label>Phone</Label>
                                    <Input
                                      value={editForm.phone || ''}
                                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Email</Label>
                                  <Input
                                    type="email"
                                    value={editForm.email || ''}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-3">
                                <DialogClose asChild>
                                  <Button variant="outline">
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                  </Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button onClick={handleSaveEdit}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
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
                  ))}
                </TableBody>
              </Table>
              {voters.length > 50 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Showing 50 of {voters.length} records. Use search to narrow down.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-shadow border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Edit3 className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-center text-muted-foreground">
              Select a municipality and ward to view and edit voter records
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
