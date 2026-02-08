import { useCallback, useState } from 'react';
import { logError } from '@/lib/errorLogger';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  MapPin } from
'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  parseFile,
  getSupportedFormats,
  getSupportedFormatsText,
  getMaxFileSizeMB,
  FileValidationError,
  ParsedRecord } from
'@/lib/fileParser';

export interface BoothUploadData {
  wardNumber: number;
  boothId: string;
  boothName: string;
  file: File | null;
  records: ParsedRecord[];
  status: 'pending' | 'uploaded' | 'error';
  fileName?: string;
}

interface BoothFileUploaderProps {
  boothUploads: BoothUploadData[];
  onBoothDataUpdate: (
  index: number,
  file: File | null,
  records: ParsedRecord[],
  status: 'pending' | 'uploaded' | 'error')
  => void;
}

export const BoothFileUploader = ({
  boothUploads,
  onBoothDataUpdate
}: BoothFileUploaderProps) => {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileUpload = useCallback(
    async (index: number, file: File) => {
      setUploadingIndex(index);
      try {
        const records = await parseFile(file);
        if (records.length === 0) {
          onBoothDataUpdate(index, file, [], 'error');
          toast.error(`No valid records found in ${file.name}`);
          return;
        }
        onBoothDataUpdate(index, file, records, 'uploaded');
        const booth = boothUploads[index];
        toast.success(
          `${records.length} records loaded for ${booth.boothName} (Ward ${booth.wardNumber})`
        );
      } catch (error) {
        logError('BoothFileUpload', error);
        onBoothDataUpdate(index, file, [], 'error');
        if (error instanceof FileValidationError) {
          toast.error(error.message);
        } else {
          toast.error(`Failed to parse ${file.name}`);
        }
      } finally {
        setUploadingIndex(null);
      }
    },
    [boothUploads, onBoothDataUpdate]
  );

  const handleFileInput = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(index, file);
      e.target.value = '';
    },
    [handleFileUpload]
  );

  const handleRemoveFile = (index: number) => {
    onBoothDataUpdate(index, null, [], 'pending');
  };

  // Group by ward for display
  const wardNumbers = [...new Set(boothUploads.map((b) => b.wardNumber))].sort(
    (a, b) => a - b
  );

  const uploadedCount = boothUploads.filter(
    (b) => b.status === 'uploaded'
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Upload voter data to individual booths. You can skip and upload later.
        </p>
        <Badge variant="outline">
          {uploadedCount} / {boothUploads.length} uploaded
        </Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {wardNumbers.map((wardNum) => {
            const wardBooths = boothUploads.filter(
              (b) => b.wardNumber === wardNum
            );
            return (
              <div key={wardNum} className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Ward {wardNum}
                </p>
                <div className="space-y-2 pl-2">
                  {wardBooths.map((booth) => {
                    const globalIndex = boothUploads.findIndex(
                      (b) =>
                      b.wardNumber === booth.wardNumber &&
                      b.boothId === booth.boothId
                    );
                    return (
                      <div
                        key={booth.boothId}
                        className={cn(
                          'flex items-center justify-between rounded-lg border p-3 transition-all',
                          booth.status === 'uploaded' &&
                          'border-success/30 bg-success/5',
                          booth.status === 'error' &&
                          'border-destructive/30 bg-destructive/5',
                          booth.status === 'pending' &&
                          'border-border hover:border-accent/50'
                        )}>

                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-accent shrink-0" />
                          <div>
                            <p className="font-medium text-sm">
                              {booth.boothName}
                            </p>
                            {booth.status === 'uploaded' && booth.fileName &&
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <FileSpreadsheet className="h-3 w-3" />
                                {booth.fileName} • {booth.records.length}{' '}
                                records
                              </p>
                            }
                            {booth.status === 'error' &&
                            <p className="text-xs text-destructive">
                                Failed to parse file
                              </p>
                            }
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {uploadingIndex === globalIndex ?
                          <Loader2 className="h-4 w-4 animate-spin text-accent" /> :
                          booth.status === 'uploaded' ?
                          <>
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveFile(globalIndex)}>

                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </> :

                          <label className="cursor-pointer">
                              <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              asChild>

                                <span>
                                  <Upload className="h-3.5 w-3.5" /> Upload
                                </span>
                              </Button>
                              <input
                              type="file"
                              accept={getSupportedFormats()}
                              onChange={(e) =>
                              handleFileInput(globalIndex, e)
                              }
                              className="hidden" />

                            </label>
                          }
                        </div>
                      </div>);

                  })}
                </div>
              </div>);

          })}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Supported formats: {getSupportedFormatsText()} • Max file size:{' '}
            {getMaxFileSizeMB()} MB
          </p>
        </div>
      </ScrollArea>
    </div>);

};