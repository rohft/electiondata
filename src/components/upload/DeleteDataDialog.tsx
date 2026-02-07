import { useState } from 'react';
import { useVoterData, MunicipalityData, WardData } from '@/contexts/VoterDataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger } from
'@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, FolderOpen, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteDataDialogProps {
  type: 'municipality' | 'ward';
  municipality: MunicipalityData;
  ward?: WardData;
  trigger?: React.ReactNode;
}

export const DeleteDataDialog = ({ type, municipality, ward, trigger }: DeleteDataDialogProps) => {
  const { t } = useLanguage();
  const { removeWardData, municipalities } = useVoterData();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    if (type === 'ward' && ward) {
      removeWardData(municipality.id, ward.id);
      toast.success(`Deleted ${ward.name}`);
    } else if (type === 'municipality') {
      // Delete all wards in municipality
      municipality.wards.forEach((w) => {
        removeWardData(municipality.id, w.id);
      });
      toast.success(`Deleted ${municipality.name} and all wards`);
    }
    setOpen(false);
  };

  const itemName = type === 'ward' ? ward?.name : municipality.name;
  const voterCount = type === 'ward' ?
  ward?.voters.length || 0 :
  municipality.wards.reduce((sum, w) => sum + w.voters.length, 0);
  const wardCount = type === 'municipality' ? municipality.wards.length : 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ||
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">

            <Trash2 className="h-4 w-4" />
          </Button>
        }
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete {type === 'ward' ? 'Ward' : 'Municipality'}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-foreground">{itemName}</span>?
              </p>
              
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border">
                {type === 'ward' ?
                <FileText className="h-8 w-8 text-muted-foreground" /> :

                <FolderOpen className="h-8 w-8 text-muted-foreground" />
                }
                <div className="flex-1">
                  <p className="font-medium">{itemName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {voterCount.toLocaleString()} voters
                    </Badge>
                    {type === 'municipality' &&
                    <Badge variant="outline" className="text-xs">
                        {wardCount} wards
                      </Badge>
                    }
                  </div>
                </div>
              </div>

              <p className="text-sm text-destructive font-medium">
                ⚠️ This action cannot be undone. All voter data will be permanently removed.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}>

            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);

};