import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";

interface BulkUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (text: string) => void;
  parentName?: string | null;
}

const placeholder = `Electronics
  Computers
    Laptops
    Desktops
  Phones
Clothing
  Men
  Women`;

export function BulkUploadDialog({ open, onClose, onUpload, parentName }: BulkUploadDialogProps) {
  const [text, setText] = useState("");

  const handleUpload = () => {
    if (text.trim()) {
      onUpload(text);
      setText("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Bulk Upload {parentName ? `into "${parentName}"` : "Root Categories"}
          </DialogTitle>
          <DialogDescription>
            Paste categories with indentation (spaces or tabs) to define hierarchy.
            {parentName && <span className="block mt-1 text-primary font-medium">Uploading as children of: {parentName}</span>}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="min-h-[200px] font-mono text-sm"
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!text.trim()}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
