import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CloudTagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
  className?: string;
  tagClassName?: string;
}

export const CloudTagInput: React.FC<CloudTagInputProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
  placeholder = 'Add new tag...',
  className,
  tagClassName
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAddTag(trimmed);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddTag}
          disabled={!inputValue.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-lg border border-border bg-muted/30">
        {tags.length === 0 ? (
          <span className="text-sm text-muted-foreground italic">No tags added yet</span>
        ) : (
          tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={cn(
                'group cursor-pointer hover:bg-destructive/20 transition-colors pl-3 pr-2 py-1.5',
                tagClassName
              )}
            >
              <span className="mr-1">{tag}</span>
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="ml-1 rounded-full p-0.5 hover:bg-destructive/30 transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
};
