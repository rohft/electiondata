import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import { Trash2, ArrowRight, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { logError } from '@/lib/errorLogger';

const _w = window as any;
const MAPPINGS_TABLE_ID = 74918;

// Source columns available from voter data
const AVAILABLE_SOURCE_COLUMNS = [
{ value: 'age', label: 'Age' },
{ value: 'gender', label: 'Gender' },
{ value: 'surname', label: 'Surname' },
{ value: 'fullName', label: 'Full Name' },
{ value: 'phone', label: 'Phone' },
{ value: 'email', label: 'Email' },
{ value: 'occupation', label: 'Occupation' },
{ value: 'tole', label: 'Tole' },
{ value: 'ward', label: 'Ward' },
{ value: 'municipality', label: 'Municipality' },
{ value: 'partyName', label: 'Party Name' },
{ value: 'voterStatus', label: 'Voter Status' }];


interface CategoryMapping {
  id: number;
  category_id: string;
  source_column: string;
  created_at: string;
}

interface CategoryFieldMappingProps {
  categoryId: string;
  categoryName: string;
}

export function CategoryFieldMapping({ categoryId, categoryName }: CategoryFieldMappingProps) {
  const [mappings, setMappings] = useState<CategoryMapping[]>([]);
  const [selectedSourceColumn, setSelectedSourceColumn] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load existing mappings for this category
  useEffect(() => {
    loadMappings();
  }, [categoryId]);

  const loadMappings = async () => {
    try {
      const { data, error } = await _w.ezsite.apis.tablePage(MAPPINGS_TABLE_ID, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: true,
        Filters: [
        { name: 'category_id', op: 'Equal', value: categoryId }]

      });

      if (error) throw error;

      setMappings(data?.List || []);
    } catch (error) {
      logError('LoadCategoryMappings', error);
    }
  };

  const handleAddMapping = async () => {
    if (!selectedSourceColumn) {
      toast.error('Please select a source column');
      return;
    }

    // Check if mapping already exists
    const exists = mappings.some((m) => m.source_column === selectedSourceColumn);
    if (exists) {
      toast.error('This source column is already mapped to this category');
      return;
    }

    setLoading(true);
    try {
      const { error } = await _w.ezsite.apis.tableCreate(MAPPINGS_TABLE_ID, {
        category_id: categoryId,
        source_column: selectedSourceColumn,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      toast.success('Mapping added successfully');
      setSelectedSourceColumn('');
      await loadMappings();
    } catch (error) {
      logError('AddCategoryMapping', error);
      toast.error('Failed to add mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMapping = async (mappingId: number, sourceColumn: string) => {
    setLoading(true);
    try {
      const { error } = await _w.ezsite.apis.tableDelete(MAPPINGS_TABLE_ID, { ID: mappingId });

      if (error) throw error;

      toast.success('Mapping removed successfully');
      await loadMappings();
    } catch (error) {
      logError('DeleteCategoryMapping', error);
      toast.error('Failed to remove mapping');
    } finally {
      setLoading(false);
    }
  };

  const getSourceColumnLabel = (value: string) => {
    return AVAILABLE_SOURCE_COLUMNS.find((col) => col.value === value)?.label || value;
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Target Field Mappings</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Map this category to source data columns from your voter data
      </p>

      {/* Add new mapping */}
      <div className="space-y-2">
        <Label className="text-xs">Add Source Column Mapping</Label>
        <div className="flex gap-2">
          <Select value={selectedSourceColumn} onValueChange={setSelectedSourceColumn}>
            <SelectTrigger className="flex-1 h-9 text-sm">
              <SelectValue placeholder="Select source column..." />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_SOURCE_COLUMNS.map((col) =>
              <SelectItem key={col.value} value={col.value}>
                  {col.label}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAddMapping}
            disabled={!selectedSourceColumn || loading}
            className="h-9">

            Map
          </Button>
        </div>
      </div>

      {/* Display existing mappings */}
      {mappings.length > 0 &&
      <div className="space-y-2">
          <Label className="text-xs">Current Mappings</Label>
          <div className="space-y-1.5">
            {mappings.map((mapping) =>
          <div
            key={mapping.id}
            className="flex items-center gap-2 p-2 rounded-md bg-background border border-border hover:border-primary/50 transition-colors group">

                <div className="flex-1 flex items-center gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">
                    {getSourceColumnLabel(mapping.source_column)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground truncate">
                    {categoryName}
                  </span>
                  <span className="text-xs text-muted-foreground">(Target Field)</span>
                </div>
                <button
              onClick={() => handleDeleteMapping(mapping.id, mapping.source_column)}
              disabled={loading}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100"
              title="Remove mapping">

                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
          )}
          </div>
        </div>
      }

      {mappings.length === 0 &&
      <div className="text-center py-4 text-xs text-muted-foreground">
          No mappings yet. Add a mapping above to connect this category to voter data.
        </div>
      }
    </div>);

}