import { useCallback, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2 } from
'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { parseFile, getSupportedFormats, getSupportedFormatsText, getMaxFileSizeMB, FileValidationError, ParsedRecord } from '@/lib/fileParser';

interface WardUploadData {
  wardNumber: number;
  file: File | null;
  records: ParsedRecord[];
  status: 'pending' | 'uploaded' | 'error';
  fileName?: string;
}

interface WardFileUploaderProps {
  wards: WardUploadData[];
  municipalityName: string;
  onWardDataUpdate: (wardIndex: number, file: File | null, records: ParsedRecord[], status: 'pending' | 'uploaded' | 'error') => void;
}

export const WardFileUploader = ({ wards, municipalityName, onWardDataUpdate }: WardFileUploaderProps) => {
  const { t } = useLanguage();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileUpload = useCallback(async (wardIndex: number, file: File) => {
    setUploadingIndex(wardIndex);

    try {
      const records = await parseFile(file);

      if (records.length === 0) {
        onWardDataUpdate(wardIndex, file, [], 'error');
        toast.error(`No valid records found in ${file.name}`);
        return;
      }

      onWardDataUpdate(wardIndex, file, records, 'uploaded');
      toast.success(`${records.length} records loaded for Ward ${wards[wardIndex].wardNumber}`);
    } catch (error) {
      console.error('File parsing error:', error);
      onWardDataUpdate(wardIndex, file, [], 'error');

      // Provide specific error messages based on error type
      if (error instanceof FileValidationError) {
        switch (error.code) {
          case 'SIZE_EXCEEDED':
            toast.error(`File too large: ${file.name}. Maximum size is ${getMaxFileSizeMB()} MB`);
            break;
          case 'INVALID_TYPE':
          case 'INVALID_MIME':
            toast.error(`Invalid file type: ${file.name}. Please upload CSV, Excel, or JSON files`);
            break;
          case 'UNSUPPORTED_FORMAT':
            toast.error(`Unsupported format: ${file.name}. Use CSV, Excel (.xlsx, .xls), or JSON`);
            break;
          default:
            toast.error(error.message);
        }
      } else if (error instanceof Error) {
        toast.error(`Failed to parse ${file.name}: ${error.message}`);
      } else {
        toast.error(`Failed to parse ${file.name}`);
      }
    } finally {
      setUploadingIndex(null);
    }
  }, [wards, onWardDataUpdate]);

  const handleFileInput = useCallback((wardIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(wardIndex, file);
    }
    // Reset input to allow re-uploading same file
    e.target.value = '';
  }, [handleFileUpload]);

  const handleRemoveFile = (wardIndex: number) => {
    onWardDataUpdate(wardIndex, null, [], 'pending');
  };

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {wards.map((ward, index) =>
        <div
          key={ward.wardNumber}
          className={cn(
            'flex items-center justify-between rounded-lg border p-4 transition-all',
            ward.status === 'uploaded' && 'border-success/30 bg-success/5',
            ward.status === 'error' && 'border-destructive/30 bg-destructive/5',
            ward.status === 'pending' && 'border-border hover:border-accent/50 hover:bg-muted/30'
          )}>

            <div className="flex items-center gap-4">
              <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg font-semibold text-sm',
              ward.status === 'uploaded' ? 'bg-success/20 text-success' :
              ward.status === 'error' ? 'bg-destructive/20 text-destructive' :
              'bg-muted text-muted-foreground'
            )}>
                {ward.wardNumber}
              </div>
              
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Ward {ward.wardNumber}
                </p>
                {ward.status === 'uploaded' && ward.fileName &&
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <FileSpreadsheet className="h-3 w-3" />
                    {ward.fileName} • {ward.records.length} records
                  </p>
              }
                {ward.status === 'error' &&
              <p className="text-xs text-destructive mt-0.5">
                    Failed to parse file
                  </p>
              }
              </div>
            </div>

            <div className="flex items-center gap-2">
              {uploadingIndex === index ?
            <Loader2 className="h-5 w-5 animate-spin text-accent" /> :
            ward.status === 'uploaded' ?
            <>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveFile(index)}>

                    <X className="h-4 w-4" />
                  </Button>
                </> :
            ward.status === 'error' ?
            <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>Retry</span>
                    </Button>
                    <input
                  type="file"
                  accept={getSupportedFormats()}
                  onChange={(e) => handleFileInput(index, e)}
                  className="hidden" />

                  </label>
                </> :

            <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <span>
                      <Upload className="h-4 w-4" />
                      Upload
                    </span>
                  </Button>
                  <input
                type="file"
                accept={getSupportedFormats()}
                onChange={(e) => handleFileInput(index, e)}
                className="hidden" />

                </label>
            }
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          Supported formats: {getSupportedFormatsText()} • Max file size: {getMaxFileSizeMB()} MB
        </p>
      </div>
    </ScrollArea>);

};