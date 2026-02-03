import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoterData, VoterRecord } from '@/contexts/VoterDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Replace, Search, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { detectCasteFromName, CASTE_CATEGORIES } from '@/lib/casteData';

interface BulkSurnameReplaceProps {
  municipalityId: string;
  wardId: string;
  voters: VoterRecord[];
  onReplace: (municipalityId: string, wardId: string, voterId: string, updates: Partial<VoterRecord>) => void;
}

export const BulkSurnameReplace = ({ 
  municipalityId, 
  wardId, 
  voters,
  onReplace 
}: BulkSurnameReplaceProps) => {
  const { t } = useLanguage();
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Find matching voters for preview
  const matchingVoters = useMemo(() => {
    if (!findText.trim()) return [];
    
    return voters.filter(voter => {
      const surname = voter.surname || '';
      return surname.includes(findText);
    });
  }, [voters, findText]);

  // Safe string replacement (avoids regex injection)
  const safeReplaceAll = (str: string, find: string, replace: string): string => {
    if (!find) return str;
    return str.split(find).join(replace);
  };

  // Detect caste and isNewar status from surname
  const detectCasteFromSurname = (surname: string): { caste: string; isNewar: boolean } => {
    const surnameLower = surname.toLowerCase().trim();
    
    for (const category of CASTE_CATEGORIES) {
      // Check English surnames
      for (const catSurname of category.surnames) {
        if (surnameLower === catSurname.toLowerCase() || surnameLower.includes(catSurname.toLowerCase())) {
          return { 
            caste: category.name, 
            isNewar: category.name === 'Newar'
          };
        }
      }
      // Check Nepali surnames
      for (const catSurnameNe of category.surnamesNe) {
        if (surname.includes(catSurnameNe)) {
          return { 
            caste: category.name, 
            isNewar: category.name === 'Newar'
          };
        }
      }
    }
    
    return { caste: 'Other', isNewar: false };
  };

  // Preview the replacement results
  const previewResults = useMemo(() => {
    return matchingVoters.map(voter => {
      const newSurname = safeReplaceAll(voter.surname || '', findText, replaceText);
      const casteInfo = detectCasteFromSurname(newSurname);
      return {
        voter,
        oldSurname: voter.surname || '',
        newSurname,
        newCaste: casteInfo.caste,
        isNewar: casteInfo.isNewar
      };
    });
  }, [matchingVoters, findText, replaceText]);

  const handleReplace = () => {
    if (!findText.trim()) {
      toast.error('Please enter text to find');
      return;
    }

    if (matchingVoters.length === 0) {
      toast.error('No matching surnames found');
      return;
    }

    let replacedCount = 0;
    
    matchingVoters.forEach(voter => {
      const oldSurname = voter.surname || '';
      const newSurname = safeReplaceAll(oldSurname, findText, replaceText);
      
      if (oldSurname !== newSurname) {
        // Detect caste and isNewar from the new surname
        const casteInfo = detectCasteFromSurname(newSurname);
        
        // Update surname, caste, and isNewar flag
        onReplace(municipalityId, wardId, voter.id, { 
          surname: newSurname,
          caste: casteInfo.caste,
          isNewar: casteInfo.isNewar
        });
        replacedCount++;
      }
    });

    toast.success(`Replaced "${findText}" with "${replaceText}" in ${replacedCount} records`);
    setFindText('');
    setReplaceText('');
    setShowPreview(false);
    setIsOpen(false);
  };

  const handleReset = () => {
    setFindText('');
    setReplaceText('');
    setShowPreview(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Replace className="h-4 w-4" />
          Find & Replace Surname
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Replace className="h-5 w-5 text-accent" />
            Bulk Find & Replace Surname (थर)
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Find and Replace Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="find" className="text-sm font-medium">
                Find (खोज्नुहोस्)
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="find"
                  placeholder="e.g. सी."
                  value={findText}
                  onChange={(e) => {
                    setFindText(e.target.value);
                    setShowPreview(false);
                  }}
                  className="pl-9 font-nepali"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="replace" className="text-sm font-medium">
                Replace with (बदल्नुहोस्)
              </Label>
              <Input
                id="replace"
                placeholder="e.g. के.सी."
                value={replaceText}
                onChange={(e) => {
                  setReplaceText(e.target.value);
                  setShowPreview(false);
                }}
                className="font-nepali"
              />
            </div>
          </div>

          {/* Match count indicator */}
          {findText && (
            <div className="flex items-center gap-2">
              {matchingVoters.length > 0 ? (
                <Badge variant="secondary" className="gap-1 bg-accent/10 text-accent border-accent/30">
                  <Check className="h-3 w-3" />
                  {matchingVoters.length} matching record{matchingVoters.length !== 1 ? 's' : ''} found
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 bg-destructive/10 text-destructive border-destructive/30">
                  <AlertCircle className="h-3 w-3" />
                  No matching surnames found
                </Badge>
              )}
            </div>
          )}

          {/* Preview Button */}
          {findText && matchingVoters.length > 0 && !showPreview && (
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(true)}
              className="w-full"
            >
              Preview Changes ({matchingVoters.length} records)
            </Button>
          )}

          {/* Preview Results */}
          {showPreview && previewResults.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview Changes</Label>
              <ScrollArea className="h-[250px] rounded-md border border-border">
                <div className="p-2 space-y-1">
                  {previewResults.slice(0, 50).map((result, idx) => (
                    <div 
                      key={result.voter.id} 
                      className={cn(
                        "flex flex-col gap-1 p-2 rounded-md text-sm",
                        idx % 2 === 0 ? "bg-muted/30" : ""
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground w-8">{idx + 1}.</span>
                        <span className="font-medium font-nepali flex-1 truncate">
                          {result.voter.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-8">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="font-nepali bg-destructive/10 text-destructive border-destructive/30 text-xs">
                            {result.oldSurname || '(empty)'}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="font-nepali bg-accent/10 text-accent border-accent/30 text-xs">
                            {result.newSurname || '(empty)'}
                          </Badge>
                        </div>
                        {result.newCaste !== result.voter.caste && (
                          <div className="flex items-center gap-1 ml-2">
                            <span className="text-xs text-muted-foreground">Caste:</span>
                            <Badge variant="outline" className="text-xs">
                              {result.voter.caste || 'Other'} → {result.newCaste}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {previewResults.length > 50 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      ... and {previewResults.length - 50} more records
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Common Nepali surname replacements hint */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Common replacements:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { find: 'सी.', replace: 'के.सी.' },
                { find: 'बि.क', replace: 'बिष्ट' },
                { find: 'बि.के', replace: 'विश्वकर्मा' },
                { find: 'बि.क.', replace: 'बिष्ट' },
              ].map((example, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 font-nepali"
                  onClick={() => {
                    setFindText(example.find);
                    setReplaceText(example.replace);
                    setShowPreview(false);
                  }}
                >
                  {example.find} → {example.replace}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleReplace}
            disabled={!findText.trim() || matchingVoters.length === 0}
            className="gap-2"
          >
            <Replace className="h-4 w-4" />
            Replace All ({matchingVoters.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
