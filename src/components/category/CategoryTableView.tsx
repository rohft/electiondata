import { useState, useMemo, useCallback } from "react";
import { Category } from "@/types/category";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Check,
  Columns3, Save, Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from
"lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FlatRow {
  id: string;
  name: string;
  parentId: string | null;
  parentPath: string;
  depth: number;
  childCount: number;
  linkCount: number;
}

interface ColumnDef {
  key: keyof FlatRow | string;
  label: string;
  width: string;
  visible: boolean;
  sortable: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
{ key: "name", label: "Name", width: "min-w-[200px]", visible: true, sortable: true },
{ key: "parentPath", label: "Parent Path", width: "min-w-[220px]", visible: true, sortable: true },
{ key: "depth", label: "Depth", width: "w-20", visible: true, sortable: true },
{ key: "childCount", label: "Children", width: "w-24", visible: true, sortable: true },
{ key: "linkCount", label: "Links", width: "w-20", visible: true, sortable: true },
{ key: "id", label: "ID", width: "w-28", visible: false, sortable: true }];


function flattenForTable(categories: Category[], depth = 0, parentPath = ""): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const cat of categories) {
    rows.push({
      id: cat.id,
      name: cat.name,
      parentId: cat.parentId,
      parentPath: parentPath || "Root",
      depth,
      childCount: cat.children.length,
      linkCount: cat.linkedIds.length
    });
    rows.push(
      ...flattenForTable(
        cat.children,
        depth + 1,
        parentPath ? `${parentPath} > ${cat.name}` : cat.name
      )
    );
  }
  return rows;
}

interface CategoryTableViewProps {
  categories: Category[];
  onRename: (id: string, newName: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

type SortDirection = "asc" | "desc" | null;

export function CategoryTableView({ categories, onRename, onSelect, selectedId }: CategoryTableViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [depthFilter, setDepthFilter] = useState<string>("all");
  const [parentFilter, setParentFilter] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.filter((c) => c.visible).map((c) => c.key)
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const pageSize = 25;

  // Flatten categories
  const allRows = useMemo(() => flattenForTable(categories), [categories]);

  // Unique parent paths and depths for filter
  const uniqueParents = useMemo(() => {
    const set = new Set(allRows.map((r) => r.parentPath));
    return Array.from(set).sort();
  }, [allRows]);

  const uniqueDepths = useMemo(() => {
    const set = new Set(allRows.map((r) => r.depth));
    return Array.from(set).sort((a, b) => a - b);
  }, [allRows]);

  // Filter
  const filteredData = useMemo(() => {
    let result = allRows;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
        r.name.toLowerCase().includes(q) ||
        r.parentPath.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }

    if (depthFilter !== "all") {
      result = result.filter((r) => r.depth === parseInt(depthFilter));
    }

    if (parentFilter !== "all") {
      result = result.filter((r) => r.parentPath === parentFilter);
    }

    return result;
  }, [allRows, searchQuery, depthFilter, parentFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn as keyof FlatRow];
      const bVal = b[sortColumn as keyof FlatRow];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  const handleSort = useCallback(
    (key: string) => {
      if (sortColumn === key) {
        if (sortDirection === "asc") setSortDirection("desc");else
        if (sortDirection === "desc") {
          setSortColumn(null);
          setSortDirection(null);
        }
      } else {
        setSortColumn(key);
        setSortDirection("asc");
      }
      setCurrentPage(1);
    },
    [sortColumn, sortDirection]
  );

  const getSortIcon = (key: string) => {
    if (sortColumn !== key) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDirection === "asc" ?
    <ArrowUp className="h-3 w-3 text-primary" /> :

    <ArrowDown className="h-3 w-3 text-primary" />;

  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
    prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const startEdit = (row: FlatRow) => {
    setEditingId(row.id);
    setEditValue(row.name);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
      toast.success(`Renamed to "${editValue.trim()}"`);
    }
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDepthFilter("all");
    setParentFilter("all");
    setCurrentPage(1);
  };

  const hasFilters = searchQuery || depthFilter !== "all" || parentFilter !== "all";
  const visibleColumnDefs = ALL_COLUMNS.filter((c) => visibleColumns.includes(c.key));

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="font-mono">
            {sortedData.length} categories
          </Badge>
          {hasFilters &&
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-8">
              <X className="h-3 w-3" />
              Clear filters
            </Button>
          }
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 w-48 h-9" />

          </div>

          {/* Depth Filter */}
          <Select value={depthFilter} onValueChange={(v) => {setDepthFilter(v);setCurrentPage(1);}}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Depth" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depths</SelectItem>
              {uniqueDepths.map((d) =>
              <SelectItem key={d} value={String(d)}>
                  Depth {d}
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {/* Parent Filter */}
          <Select value={parentFilter} onValueChange={(v) => {setParentFilter(v);setCurrentPage(1);}}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Parent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parents</SelectItem>
              {uniqueParents.map((p) =>
              <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {/* Column Toggle */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Columns3 className="h-4 w-4" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {ALL_COLUMNS.map((col) =>
                <label
                  key={col.key}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">

                    <Checkbox
                    checked={visibleColumns.includes(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)} />

                    <span className="text-sm">{col.label}</span>
                  </label>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <ScrollArea className="w-full">
          <div className="min-w-max" dir="ltr">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 sticky top-0 z-10">
                <tr>
                  {/* Actions column on left */}
                  <th className="px-3 py-2.5 text-center font-semibold text-foreground border-b border-border w-20 sticky left-0 bg-muted/60 z-20">
                    Edit
                  </th>
                  {visibleColumnDefs.map((col) =>
                  <th
                    key={col.key}
                    className={cn(
                      "px-3 py-2.5 text-left font-semibold text-foreground border-b border-border",
                      col.width,
                      col.sortable && "cursor-pointer hover:bg-muted/80 select-none transition-colors"
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}>

                      <div className="flex items-center gap-1.5">
                        <span>{col.label}</span>
                        {col.sortable && getSortIcon(col.key)}
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ?
                <tr>
                    <td
                    colSpan={visibleColumnDefs.length + 1}
                    className="px-4 py-12 text-center text-muted-foreground">

                      No categories match the current filters
                    </td>
                  </tr> :

                paginatedData.map((row) => {
                  const isEditing = editingId === row.id;
                  const isSelected = selectedId === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-border/50 transition-colors hover:bg-muted/30",
                        isSelected && "bg-primary/5"
                      )}
                      onClick={() => onSelect(row.id)}>

                        {/* Edit action - left column */}
                        <td className="px-3 py-2 text-center sticky left-0 bg-card z-10">
                          {isEditing ?
                        <div className="flex items-center gap-1 justify-center">
                              <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              saveEdit();
                            }}>

                                <Save className="h-3.5 w-3.5 text-primary" />
                              </Button>
                              <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEdit();
                            }}>

                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div> :

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(row);
                          }}>

                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        }
                        </td>

                        {visibleColumnDefs.map((col) =>
                      <td key={col.key} className={cn("px-3 py-2", col.width)}>
                            {col.key === "name" && isEditing ?
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 text-sm"
                          autoFocus /> :

                        col.key === "name" ?
                        <span className="font-medium">{row.name}</span> :
                        col.key === "parentPath" ?
                        <span className="text-muted-foreground text-xs">{row.parentPath}</span> :
                        col.key === "depth" ?
                        <Badge variant="outline" className="text-xs">
                                {row.depth}
                              </Badge> :
                        col.key === "childCount" ?
                        row.childCount > 0 ?
                        <Badge variant="secondary" className="text-xs">
                                  {row.childCount}
                                </Badge> :

                        <span className="text-muted-foreground">—</span> :

                        col.key === "linkCount" ?
                        row.linkCount > 0 ?
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                  {row.linkCount}
                                </Badge> :

                        <span className="text-muted-foreground">—</span> :


                        <span className="text-xs text-muted-foreground font-mono">
                                {String(row[col.key as keyof FlatRow] ?? "")}
                              </span>
                        }
                          </td>
                      )}
                      </tr>);

                })
                }
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Pagination */}
      {totalPages > 1 &&
      <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      }
    </div>);

}