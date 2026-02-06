import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MapPin, Check, X, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface BoothConfig {
  id: string;
  name: string;
}

export interface WardBoothConfig {
  wardNumber: number;
  booths: BoothConfig[];
}

interface BoothSetupStepProps {
  wardBooths: WardBoothConfig[];
  onWardBoothsChange: (wardBooths: WardBoothConfig[]) => void;
}

export const BoothSetupStep = ({ wardBooths, onWardBoothsChange }: BoothSetupStepProps) => {
  const [expandedWards, setExpandedWards] = useState<number[]>(wardBooths.map(w => w.wardNumber));
  const [addingToWard, setAddingToWard] = useState<number | null>(null);
  const [newBoothName, setNewBoothName] = useState('');
  const [renamingBooth, setRenamingBooth] = useState<{ wardNumber: number; boothId: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleWard = (wardNumber: number) => {
    setExpandedWards(prev =>
      prev.includes(wardNumber) ? prev.filter(n => n !== wardNumber) : [...prev, wardNumber]
    );
  };

  const addBooth = (wardNumber: number) => {
    if (!newBoothName.trim()) return;
    onWardBoothsChange(wardBooths.map(ward => {
      if (ward.wardNumber === wardNumber) {
        return {
          ...ward,
          booths: [...ward.booths, { id: crypto.randomUUID(), name: newBoothName.trim() }]
        };
      }
      return ward;
    }));
    setNewBoothName('');
    setAddingToWard(null);
  };

  const removeBooth = (wardNumber: number, boothId: string) => {
    onWardBoothsChange(wardBooths.map(ward => {
      if (ward.wardNumber === wardNumber && ward.booths.length > 1) {
        return { ...ward, booths: ward.booths.filter(b => b.id !== boothId) };
      }
      return ward;
    }));
  };

  const renameBooth = (wardNumber: number, boothId: string) => {
    if (!renameValue.trim()) return;
    onWardBoothsChange(wardBooths.map(ward => {
      if (ward.wardNumber === wardNumber) {
        return {
          ...ward,
          booths: ward.booths.map(b => b.id === boothId ? { ...b, name: renameValue.trim() } : b)
        };
      }
      return ward;
    }));
    setRenamingBooth(null);
    setRenameValue('');
  };

  const totalBooths = wardBooths.reduce((sum, w) => sum + w.booths.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure booth centres for each ward. Click a booth name to rename it.
        </p>
        <Badge variant="outline">{totalBooths} booth(s)</Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {wardBooths.map(ward => (
            <Collapsible
              key={ward.wardNumber}
              open={expandedWards.includes(ward.wardNumber)}
              onOpenChange={() => toggleWard(ward.wardNumber)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-9 font-medium"
                >
                  {expandedWards.includes(ward.wardNumber)
                    ? <ChevronDown className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />
                  }
                  Ward {ward.wardNumber}
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {ward.booths.length} booth(s)
                  </Badge>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1 mt-1">
                {ward.booths.map(booth => (
                  <div key={booth.id} className="flex items-center gap-2 group">
                    {renamingBooth?.boothId === booth.id && renamingBooth?.wardNumber === ward.wardNumber ? (
                      <div className="flex items-center gap-1 flex-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') renameBooth(ward.wardNumber, booth.id);
                            if (e.key === 'Escape') setRenamingBooth(null);
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => renameBooth(ward.wardNumber, booth.id)}>
                          <Check className="h-3 w-3 text-accent" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRenamingBooth(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center gap-2 flex-1 h-7 px-2 text-sm rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setRenamingBooth({ wardNumber: ward.wardNumber, boothId: booth.id });
                            setRenameValue(booth.name);
                          }}
                        >
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                          <span>{booth.name}</span>
                        </div>
                        {ward.booths.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            onClick={() => removeBooth(ward.wardNumber, booth.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {/* Add booth inline */}
                {addingToWard === ward.wardNumber ? (
                  <div className="flex items-center gap-1 px-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <Input
                      value={newBoothName}
                      onChange={(e) => setNewBoothName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addBooth(ward.wardNumber);
                        if (e.key === 'Escape') { setAddingToWard(null); setNewBoothName(''); }
                      }}
                      placeholder="Booth name..."
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addBooth(ward.wardNumber)}>
                      <Check className="h-3 w-3 text-accent" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setAddingToWard(null); setNewBoothName(''); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-1.5 h-7 text-sm text-muted-foreground"
                    onClick={() => setAddingToWard(ward.wardNumber)}
                  >
                    <Plus className="h-3 w-3" />
                    Add Booth...
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
