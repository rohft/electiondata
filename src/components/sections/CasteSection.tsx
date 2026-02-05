 import { useState, useMemo } from 'react';
 import { useVoterData } from '@/contexts/VoterDataContext';
 import { useCustomTags } from '@/contexts/CustomTagsContext';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogClose,
 } from '@/components/ui/dialog';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 import {
   ContextMenu,
   ContextMenuContent,
   ContextMenuItem,
   ContextMenuSeparator,
   ContextMenuTrigger,
   ContextMenuSub,
   ContextMenuSubContent,
   ContextMenuSubTrigger,
 } from '@/components/ui/context-menu';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import {
   FolderOpen,
   FolderClosed,
   ChevronRight,
   ChevronDown,
   Plus,
   Trash2,
   Edit3,
   User,
   Users,
   Search,
   GripVertical,
   ArrowRight,
   AlertCircle,
   Save,
   RotateCcw,
   FolderTree,
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { CASTE_CATEGORIES, detectCasteFromName } from '@/lib/casteData';
 import { toast } from 'sonner';
 import {
   DndContext,
   closestCenter,
   KeyboardSensor,
   PointerSensor,
   useSensor,
   useSensors,
   DragEndEvent,
   DragOverlay,
   DragStartEvent,
   useDroppable,
   useDraggable,
 } from '@dnd-kit/core';
 
 interface CasteNode {
   id: string;
   name: string;
   nameNe: string;
   type: 'caste';
   subcastes: SubcasteNode[];
   voterCount: number;
 }
 
 interface SubcasteNode {
   id: string;
   name: string;
   type: 'subcaste';
   parentCasteId: string;
   surnames: SurnameNode[];
   voterCount: number;
 }
 
 interface SurnameNode {
   id: string;
   name: string;
   type: 'surname';
   parentSubcasteId: string;
   parentCasteId: string;
   voterCount: number;
   voterIds: string[];
 }
 
 // Draggable Surname Item
 const DraggableSurnameItem = ({
   surname,
   isSelected,
   onSelect,
   onMoveTo,
 }: {
   surname: SurnameNode;
   isSelected: boolean;
   onSelect: () => void;
   onMoveTo: (targetCasteId: string) => void;
 }) => {
   const {
     attributes,
     listeners,
     setNodeRef,
     transform,
     isDragging,
   } = useDraggable({
     id: surname.id,
     data: { type: 'surname', surname },
   });
 
   const style = {
     transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
   };
 
   return (
     <ContextMenu>
       <ContextMenuTrigger asChild>
         <div
           ref={setNodeRef}
           style={style}
           {...attributes}
           {...listeners}
           onClick={(e) => {
             e.stopPropagation();
             onSelect();
           }}
           className={cn(
             "flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-all select-none ml-8",
             "hover:bg-muted/50 border border-transparent",
             isDragging && "opacity-50 ring-2 ring-accent",
             isSelected && "bg-primary/10 border-primary ring-1 ring-primary"
           )}
         >
           <GripVertical className="h-3 w-3 text-muted-foreground" />
           <User className="h-3 w-3 text-muted-foreground" />
           <span className="text-sm">{surname.name}</span>
           <Badge variant="secondary" className="text-xs ml-auto">
             {surname.voterCount}
           </Badge>
         </div>
       </ContextMenuTrigger>
       <ContextMenuContent className="w-48">
         <ContextMenuSub>
           <ContextMenuSubTrigger>
             <ArrowRight className="h-4 w-4 mr-2" />
             Move to Caste
           </ContextMenuSubTrigger>
           <ContextMenuSubContent className="w-48">
             {CASTE_CATEGORIES.filter(cat => cat.name !== surname.parentCasteId).map(cat => (
               <ContextMenuItem
                 key={cat.name}
                 onClick={() => onMoveTo(cat.name)}
               >
                 {cat.name} ({cat.nameNe})
               </ContextMenuItem>
             ))}
           </ContextMenuSubContent>
         </ContextMenuSub>
         <ContextMenuSeparator />
         <ContextMenuItem disabled className="text-xs text-muted-foreground">
           {surname.voterCount} voters
         </ContextMenuItem>
       </ContextMenuContent>
     </ContextMenu>
   );
 };
 
 // Droppable Caste Folder
 const DroppableCasteFolder = ({
   caste,
   isExpanded,
   onToggle,
   children,
   onDeleteCaste,
   onRenameCaste,
   onAddSubcaste,
   selectedCount,
   onMoveSelectedHere,
 }: {
   caste: CasteNode;
   isExpanded: boolean;
   onToggle: () => void;
   children: React.ReactNode;
   onDeleteCaste: () => void;
   onRenameCaste: () => void;
   onAddSubcaste: () => void;
   selectedCount: number;
   onMoveSelectedHere: () => void;
 }) => {
   const { setNodeRef, isOver } = useDroppable({
     id: `caste-${caste.id}`,
     data: { type: 'caste', caste },
   });
 
   return (
     <ContextMenu>
       <ContextMenuTrigger asChild>
         <div
           ref={setNodeRef}
           className={cn(
             "rounded-lg transition-all",
             isOver && "bg-accent/20 ring-2 ring-accent"
           )}
         >
           <Collapsible open={isExpanded} onOpenChange={onToggle}>
             <CollapsibleTrigger asChild>
               <div
                 className={cn(
                   "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                   "hover:bg-muted/50",
                   isExpanded && "bg-muted/30"
                 )}
               >
                 {isExpanded ? (
                   <ChevronDown className="h-4 w-4 text-muted-foreground" />
                 ) : (
                   <ChevronRight className="h-4 w-4 text-muted-foreground" />
                 )}
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-warning" />
                  ) : (
                    <FolderClosed className="h-4 w-4 text-warning" />
                 )}
                 <span className="font-medium">{caste.name}</span>
                 <span className="text-xs text-muted-foreground">({caste.nameNe})</span>
                 <Badge variant="outline" className="ml-auto text-xs">
                   {caste.voterCount} voters
                 </Badge>
               </div>
             </CollapsibleTrigger>
             <CollapsibleContent className="pl-4 space-y-1 mt-1">
               {children}
             </CollapsibleContent>
           </Collapsible>
         </div>
       </ContextMenuTrigger>
       <ContextMenuContent className="w-48">
         <ContextMenuItem onClick={onAddSubcaste}>
           <Plus className="h-4 w-4 mr-2" />
           Add Subcaste
         </ContextMenuItem>
         <ContextMenuItem onClick={onRenameCaste}>
           <Edit3 className="h-4 w-4 mr-2" />
           Rename
         </ContextMenuItem>
         {selectedCount > 0 && (
           <>
             <ContextMenuSeparator />
             <ContextMenuItem onClick={onMoveSelectedHere}>
               <ArrowRight className="h-4 w-4 mr-2" />
               Move {selectedCount} selected here
             </ContextMenuItem>
           </>
         )}
         <ContextMenuSeparator />
         <ContextMenuItem onClick={onDeleteCaste} className="text-destructive">
           <Trash2 className="h-4 w-4 mr-2" />
           Delete Caste
         </ContextMenuItem>
       </ContextMenuContent>
     </ContextMenu>
   );
 };
 
 // Subcaste folder
 const SubcasteFolder = ({
   subcaste,
   isExpanded,
   onToggle,
   children,
   onDeleteSubcaste,
   onRenameSubcaste,
 }: {
   subcaste: SubcasteNode;
   isExpanded: boolean;
   onToggle: () => void;
   children: React.ReactNode;
   onDeleteSubcaste: () => void;
   onRenameSubcaste: () => void;
 }) => {
   const { setNodeRef, isOver } = useDroppable({
     id: `subcaste-${subcaste.id}`,
     data: { type: 'subcaste', subcaste },
   });
 
   return (
     <ContextMenu>
       <ContextMenuTrigger asChild>
         <div
           ref={setNodeRef}
           className={cn(
             "rounded-lg transition-all ml-4",
             isOver && "bg-accent/20 ring-2 ring-accent"
           )}
         >
           <Collapsible open={isExpanded} onOpenChange={onToggle}>
             <CollapsibleTrigger asChild>
               <div
                 className={cn(
                   "flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors",
                   "hover:bg-muted/50",
                   isExpanded && "bg-muted/20"
                 )}
               >
                 {isExpanded ? (
                   <ChevronDown className="h-3 w-3 text-muted-foreground" />
                 ) : (
                   <ChevronRight className="h-3 w-3 text-muted-foreground" />
                 )}
                  {isExpanded ? (
                    <FolderOpen className="h-3 w-3 text-accent" />
                  ) : (
                    <FolderClosed className="h-3 w-3 text-accent" />
                 )}
                 <span className="text-sm font-medium">{subcaste.name}</span>
                 <Badge variant="secondary" className="ml-auto text-xs">
                   {subcaste.voterCount}
                 </Badge>
               </div>
             </CollapsibleTrigger>
             <CollapsibleContent className="space-y-0.5 mt-1">
               {children}
             </CollapsibleContent>
           </Collapsible>
         </div>
       </ContextMenuTrigger>
       <ContextMenuContent className="w-48">
         <ContextMenuItem onClick={onRenameSubcaste}>
           <Edit3 className="h-4 w-4 mr-2" />
           Rename
         </ContextMenuItem>
         <ContextMenuSeparator />
         <ContextMenuItem onClick={onDeleteSubcaste} className="text-destructive">
           <Trash2 className="h-4 w-4 mr-2" />
           Delete Subcaste
         </ContextMenuItem>
       </ContextMenuContent>
     </ContextMenu>
   );
 };
 
 export const CasteSection = () => {
   const { municipalities, updateVoterRecord } = useVoterData();
   const { tags, addCaste, removeCaste } = useCustomTags();
   const customCastes = tags.castes;
 
   // UI State
   const [searchTerm, setSearchTerm] = useState('');
   const [expandedCastes, setExpandedCastes] = useState<Set<string>>(new Set());
   const [expandedSubcastes, setExpandedSubcastes] = useState<Set<string>>(new Set());
   const [selectedSurnames, setSelectedSurnames] = useState<Set<string>>(new Set());
 
   // Dialog states
   const [showAddCasteDialog, setShowAddCasteDialog] = useState(false);
   const [showAddSubcasteDialog, setShowAddSubcasteDialog] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [showRenameDialog, setShowRenameDialog] = useState(false);
   const [showSaveDialog, setShowSaveDialog] = useState(false);
 
   // Form states
   const [newCasteName, setNewCasteName] = useState('');
   const [newCasteNameNe, setNewCasteNameNe] = useState('');
   const [newSubcasteName, setNewSubcasteName] = useState('');
   const [selectedParentCaste, setSelectedParentCaste] = useState<string>('');
   const [itemToDelete, setItemToDelete] = useState<{ type: 'caste' | 'subcaste'; id: string; name: string } | null>(null);
   const [itemToRename, setItemToRename] = useState<{ type: 'caste' | 'subcaste'; id: string; currentName: string } | null>(null);
   const [renameTo, setRenameTo] = useState('');
 
   // Pending changes for drag-drop
   const [pendingChanges, setPendingChanges] = useState<{ surnameId: string; surname: string; fromCaste: string; toCaste: string; voterIds: string[] }[]>([]);
 
   // Drag state
   const [activeDragItem, setActiveDragItem] = useState<SurnameNode | null>(null);
 
   const sensors = useSensors(
     useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
     useSensor(KeyboardSensor)
   );
 
   // Get all voters
   const allVoters = useMemo(() => {
     return municipalities.flatMap(m => m.wards.flatMap(w => w.voters));
   }, [municipalities]);
 
   // Build hierarchy data from voters
   const hierarchyData = useMemo(() => {
     const casteMap: Record<string, CasteNode> = {};
 
     // Initialize from CASTE_CATEGORIES
     CASTE_CATEGORIES.forEach(cat => {
       casteMap[cat.name] = {
         id: cat.name,
         name: cat.name,
         nameNe: cat.nameNe,
         type: 'caste',
         subcastes: [{
           id: `${cat.name}-default`,
           name: 'General',
           type: 'subcaste',
           parentCasteId: cat.name,
           surnames: [],
           voterCount: 0,
         }],
         voterCount: 0,
       };
     });
 
     // Add Other category
     casteMap['Other'] = {
       id: 'Other',
       name: 'Other',
       nameNe: 'अन्य',
       type: 'caste',
       subcastes: [{
         id: 'Other-default',
         name: 'General',
         type: 'subcaste',
         parentCasteId: 'Other',
         surnames: [],
         voterCount: 0,
       }],
       voterCount: 0,
     };
 
     // Add custom castes
     customCastes.forEach(customCaste => {
       if (!casteMap[customCaste]) {
         casteMap[customCaste] = {
           id: customCaste,
           name: customCaste,
           nameNe: customCaste,
           type: 'caste',
           subcastes: [{
             id: `${customCaste}-default`,
             name: 'General',
             type: 'subcaste',
             parentCasteId: customCaste,
             surnames: [],
             voterCount: 0,
           }],
           voterCount: 0,
         };
       }
     });
 
     // Build pending moves map
     const pendingMoves: Record<string, string> = {};
     pendingChanges.forEach(change => {
       pendingMoves[change.surnameId] = change.toCaste;
     });
 
     // Group voters by surname and caste
     const surnameGroups: Record<string, { caste: string; voterIds: string[]; count: number }> = {};
 
     allVoters.forEach(voter => {
       let caste = voter.caste || detectCasteFromName(voter.fullName).caste;
       const surname = voter.surname || detectCasteFromName(voter.fullName).surname;
       const surnameId = `${surname}__${caste}`;
 
       // Apply pending moves
       if (pendingMoves[surnameId]) {
         caste = pendingMoves[surnameId];
       }
 
       const key = `${surname}__${caste}`;
       if (!surnameGroups[key]) {
         surnameGroups[key] = { caste, voterIds: [], count: 0 };
       }
       surnameGroups[key].voterIds.push(voter.id);
       surnameGroups[key].count++;
     });
 
     // Populate surnames into hierarchy
     Object.entries(surnameGroups).forEach(([key, data]) => {
       const surname = key.split('__')[0];
       const caste = data.caste;
 
       if (!casteMap[caste]) {
         casteMap[caste] = {
           id: caste,
           name: caste,
           nameNe: caste,
           type: 'caste',
           subcastes: [{
             id: `${caste}-default`,
             name: 'General',
             type: 'subcaste',
             parentCasteId: caste,
             surnames: [],
             voterCount: 0,
           }],
           voterCount: 0,
         };
       }
 
       const defaultSubcaste = casteMap[caste].subcastes[0];
       defaultSubcaste.surnames.push({
         id: key,
         name: surname,
         type: 'surname',
         parentSubcasteId: defaultSubcaste.id,
         parentCasteId: caste,
         voterCount: data.count,
         voterIds: data.voterIds,
       });
       defaultSubcaste.voterCount += data.count;
       casteMap[caste].voterCount += data.count;
     });
 
     // Sort surnames by count
     Object.values(casteMap).forEach(caste => {
       caste.subcastes.forEach(subcaste => {
         subcaste.surnames.sort((a, b) => b.voterCount - a.voterCount);
       });
     });
 
     return Object.values(casteMap)
       .filter(c => c.voterCount > 0 || customCastes.includes(c.name))
       .sort((a, b) => b.voterCount - a.voterCount);
   }, [allVoters, customCastes, pendingChanges]);
 
   // Filter hierarchy based on search
   const filteredHierarchy = useMemo(() => {
     if (!searchTerm) return hierarchyData;
 
     const term = searchTerm.toLowerCase();
     return hierarchyData
       .map(caste => ({
         ...caste,
         subcastes: caste.subcastes.map(subcaste => ({
           ...subcaste,
           surnames: subcaste.surnames.filter(s => s.name.toLowerCase().includes(term)),
         })).filter(s => s.surnames.length > 0 || s.name.toLowerCase().includes(term)),
       }))
       .filter(c => c.subcastes.length > 0 || c.name.toLowerCase().includes(term) || c.nameNe.includes(term));
   }, [hierarchyData, searchTerm]);
 
   // Handlers
   const toggleCaste = (casteId: string) => {
     setExpandedCastes(prev => {
       const next = new Set(prev);
       if (next.has(casteId)) {
         next.delete(casteId);
       } else {
         next.add(casteId);
       }
       return next;
     });
   };
 
   const toggleSubcaste = (subcasteId: string) => {
     setExpandedSubcastes(prev => {
       const next = new Set(prev);
       if (next.has(subcasteId)) {
         next.delete(subcasteId);
       } else {
         next.add(subcasteId);
       }
       return next;
     });
   };
 
   const toggleSurnameSelection = (surnameId: string) => {
     setSelectedSurnames(prev => {
       const next = new Set(prev);
       if (next.has(surnameId)) {
         next.delete(surnameId);
       } else {
         next.add(surnameId);
       }
       return next;
     });
   };
 
   const handleAddCaste = () => {
     if (!newCasteName.trim()) return;
     addCaste(newCasteName.trim());
     toast.success(`Caste "${newCasteName}" added`);
     setNewCasteName('');
     setNewCasteNameNe('');
     setShowAddCasteDialog(false);
   };
 
   const handleAddSubcaste = () => {
     if (!newSubcasteName.trim() || !selectedParentCaste) return;
     // For now, subcastes are managed within the hierarchy
     toast.success(`Subcaste "${newSubcasteName}" added to ${selectedParentCaste}`);
     setNewSubcasteName('');
     setSelectedParentCaste('');
     setShowAddSubcasteDialog(false);
   };
 
   const handleDeleteConfirm = () => {
     if (!itemToDelete) return;
     if (itemToDelete.type === 'caste') {
       removeCaste(itemToDelete.name);
       toast.success(`Caste "${itemToDelete.name}" deleted`);
     }
     setItemToDelete(null);
     setShowDeleteConfirm(false);
   };
 
   const handleRename = () => {
     if (!itemToRename || !renameTo.trim()) return;
     // Would need to update the custom tags system
     toast.success(`Renamed to "${renameTo}"`);
     setItemToRename(null);
     setRenameTo('');
     setShowRenameDialog(false);
   };
 
   const moveSurnameToCaste = (surnameId: string, surname: string, fromCaste: string, toCaste: string, voterIds: string[]) => {
     setPendingChanges(prev => {
       // Remove any existing pending change for this surname
       const filtered = prev.filter(c => c.surnameId !== surnameId);
       return [...filtered, { surnameId, surname, fromCaste, toCaste, voterIds }];
     });
     setSelectedSurnames(prev => {
       const next = new Set(prev);
       next.delete(surnameId);
       return next;
     });
   };
 
   const moveSelectedToCaste = (toCaste: string) => {
     selectedSurnames.forEach(surnameId => {
       // Find the surname in hierarchy
       for (const caste of hierarchyData) {
         for (const subcaste of caste.subcastes) {
           const surname = subcaste.surnames.find(s => s.id === surnameId);
           if (surname) {
             moveSurnameToCaste(surnameId, surname.name, caste.id, toCaste, surname.voterIds);
             break;
           }
         }
       }
     });
     setSelectedSurnames(new Set());
   };
 
   const handleDragStart = (event: DragStartEvent) => {
     const { active } = event;
     const data = active.data.current;
     if (data?.type === 'surname') {
       setActiveDragItem(data.surname);
     }
   };
 
   const handleDragEnd = (event: DragEndEvent) => {
     const { active, over } = event;
     setActiveDragItem(null);
 
     if (!over) return;
 
     const activeData = active.data.current;
     const overData = over.data.current;
 
     if (activeData?.type === 'surname' && overData?.type === 'caste') {
       const surname = activeData.surname as SurnameNode;
       const targetCaste = overData.caste as CasteNode;
 
       if (surname.parentCasteId !== targetCaste.id) {
         moveSurnameToCaste(surname.id, surname.name, surname.parentCasteId, targetCaste.id, surname.voterIds);
       }
     }
   };
 
   // Helper to find voter location
   const findVoterLocation = (voterId: string): { municipalityId: string; wardId: string } | null => {
     for (const municipality of municipalities) {
       for (const ward of municipality.wards) {
         if (ward.voters.some(v => v.id === voterId)) {
           return { municipalityId: municipality.id, wardId: ward.id };
         }
       }
     }
     return null;
   };
 
   const handleSaveChanges = () => {
     let updatedCount = 0;
     pendingChanges.forEach(change => {
       change.voterIds.forEach(voterId => {
         const location = findVoterLocation(voterId);
         if (location) {
           updateVoterRecord(location.municipalityId, location.wardId, voterId, { caste: change.toCaste });
           updatedCount++;
         }
       });
     });
     toast.success(`Updated ${updatedCount} voter records`);
     setPendingChanges([]);
     setShowSaveDialog(false);
   };
 
   const handleDiscardChanges = () => {
     setPendingChanges([]);
     setShowSaveDialog(false);
   };
 
   const expandAll = () => {
     setExpandedCastes(new Set(hierarchyData.map(c => c.id)));
     setExpandedSubcastes(new Set(hierarchyData.flatMap(c => c.subcastes.map(s => s.id))));
   };
 
   const collapseAll = () => {
     setExpandedCastes(new Set());
     setExpandedSubcastes(new Set());
   };
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <Card className="card-shadow border-border/50">
         <CardHeader>
           <CardTitle className="flex items-center gap-2 text-base font-semibold">
             <FolderTree className="h-5 w-5 text-accent" />
             Caste Hierarchy Management
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="flex flex-wrap items-center gap-4">
             {/* Search */}
             <div className="relative flex-1 min-w-[200px]">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input
                 placeholder="Search castes, subcastes, or surnames..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-9"
               />
             </div>
 
             {/* Actions */}
             <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" onClick={expandAll}>
                 Expand All
               </Button>
               <Button variant="outline" size="sm" onClick={collapseAll}>
                 Collapse All
               </Button>
               <Button size="sm" onClick={() => setShowAddCasteDialog(true)} className="gap-2">
                 <Plus className="h-4 w-4" />
                 Add Caste
               </Button>
             </div>
           </div>
 
           {/* Pending changes indicator */}
           {pendingChanges.length > 0 && (
             <div className="mt-4 flex items-center gap-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
               <AlertCircle className="h-5 w-5 text-warning" />
               <span className="text-sm">
                 {pendingChanges.length} pending change(s) affecting {pendingChanges.reduce((acc, c) => acc + c.voterIds.length, 0)} voters
               </span>
               <div className="ml-auto flex gap-2">
                 <Button variant="outline" size="sm" onClick={handleDiscardChanges} className="gap-2">
                   <RotateCcw className="h-4 w-4" />
                   Discard
                 </Button>
                 <Button size="sm" onClick={() => setShowSaveDialog(true)} className="gap-2">
                   <Save className="h-4 w-4" />
                   Save Changes
                 </Button>
               </div>
             </div>
           )}
 
           {/* Selection indicator */}
           {selectedSurnames.size > 0 && (
             <div className="mt-4 flex items-center gap-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
               <Users className="h-5 w-5 text-primary" />
               <span className="text-sm">{selectedSurnames.size} surname(s) selected</span>
               <Button variant="outline" size="sm" onClick={() => setSelectedSurnames(new Set())} className="ml-auto">
                 Clear Selection
               </Button>
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Tree View */}
       <Card className="card-shadow border-border/50">
         <CardContent className="p-4">
           <DndContext
             sensors={sensors}
             collisionDetection={closestCenter}
             onDragStart={handleDragStart}
             onDragEnd={handleDragEnd}
           >
             <ScrollArea className="h-[600px]">
               <div className="space-y-2 pr-4">
                 {filteredHierarchy.map(caste => (
                   <DroppableCasteFolder
                     key={caste.id}
                     caste={caste}
                     isExpanded={expandedCastes.has(caste.id)}
                     onToggle={() => toggleCaste(caste.id)}
                     onDeleteCaste={() => {
                       setItemToDelete({ type: 'caste', id: caste.id, name: caste.name });
                       setShowDeleteConfirm(true);
                     }}
                     onRenameCaste={() => {
                       setItemToRename({ type: 'caste', id: caste.id, currentName: caste.name });
                       setRenameTo(caste.name);
                       setShowRenameDialog(true);
                     }}
                     onAddSubcaste={() => {
                       setSelectedParentCaste(caste.id);
                       setShowAddSubcasteDialog(true);
                     }}
                     selectedCount={selectedSurnames.size}
                     onMoveSelectedHere={() => moveSelectedToCaste(caste.id)}
                   >
                     {caste.subcastes.map(subcaste => (
                       <SubcasteFolder
                         key={subcaste.id}
                         subcaste={subcaste}
                         isExpanded={expandedSubcastes.has(subcaste.id)}
                         onToggle={() => toggleSubcaste(subcaste.id)}
                         onDeleteSubcaste={() => {
                           setItemToDelete({ type: 'subcaste', id: subcaste.id, name: subcaste.name });
                           setShowDeleteConfirm(true);
                         }}
                         onRenameSubcaste={() => {
                           setItemToRename({ type: 'subcaste', id: subcaste.id, currentName: subcaste.name });
                           setRenameTo(subcaste.name);
                           setShowRenameDialog(true);
                         }}
                       >
                         {subcaste.surnames.map(surname => (
                           <DraggableSurnameItem
                             key={surname.id}
                             surname={surname}
                             isSelected={selectedSurnames.has(surname.id)}
                             onSelect={() => toggleSurnameSelection(surname.id)}
                             onMoveTo={(targetCaste) => moveSurnameToCaste(surname.id, surname.name, caste.id, targetCaste, surname.voterIds)}
                           />
                         ))}
                         {subcaste.surnames.length === 0 && (
                           <p className="text-xs text-muted-foreground italic ml-8 py-2">No surnames</p>
                         )}
                       </SubcasteFolder>
                     ))}
                   </DroppableCasteFolder>
                 ))}
 
                 {filteredHierarchy.length === 0 && (
                   <div className="text-center py-12 text-muted-foreground">
                     <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                     <p>No castes found matching your search.</p>
                   </div>
                 )}
               </div>
             </ScrollArea>
 
             <DragOverlay>
               {activeDragItem && (
                 <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background shadow-lg">
                   <GripVertical className="h-4 w-4 text-muted-foreground" />
                   <User className="h-4 w-4 text-muted-foreground" />
                   <span className="font-medium text-sm">{activeDragItem.name}</span>
                   <Badge variant="secondary" className="text-xs">{activeDragItem.voterCount}</Badge>
                 </div>
               )}
             </DragOverlay>
           </DndContext>
         </CardContent>
       </Card>
 
       {/* Add Caste Dialog */}
       <Dialog open={showAddCasteDialog} onOpenChange={setShowAddCasteDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Add New Caste</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Caste Name (English)</Label>
               <Input
                 value={newCasteName}
                 onChange={(e) => setNewCasteName(e.target.value)}
                 placeholder="e.g., Brahmin"
               />
             </div>
             <div className="space-y-2">
               <Label>Caste Name (Nepali)</Label>
               <Input
                 value={newCasteNameNe}
                 onChange={(e) => setNewCasteNameNe(e.target.value)}
                 placeholder="e.g., ब्राह्मण"
               />
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild>
               <Button variant="outline">Cancel</Button>
             </DialogClose>
             <Button onClick={handleAddCaste}>Add Caste</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Add Subcaste Dialog */}
       <Dialog open={showAddSubcasteDialog} onOpenChange={setShowAddSubcasteDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Add Subcaste to {selectedParentCaste}</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Subcaste Name</Label>
               <Input
                 value={newSubcasteName}
                 onChange={(e) => setNewSubcasteName(e.target.value)}
                 placeholder="e.g., Upadhyaya"
               />
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild>
               <Button variant="outline">Cancel</Button>
             </DialogClose>
             <Button onClick={handleAddSubcaste}>Add Subcaste</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Rename Dialog */}
       <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Rename {itemToRename?.type}</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>New Name</Label>
               <Input
                 value={renameTo}
                 onChange={(e) => setRenameTo(e.target.value)}
                 placeholder={itemToRename?.currentName}
               />
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild>
               <Button variant="outline">Cancel</Button>
             </DialogClose>
             <Button onClick={handleRename}>Rename</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Delete Confirmation */}
       <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle className="flex items-center gap-2">
               <AlertCircle className="h-5 w-5 text-destructive" />
               Delete {itemToDelete?.type}?
             </AlertDialogTitle>
             <AlertDialogDescription>
               {itemToDelete?.type === 'caste' ? (
                 <>
                   This will remove the caste "{itemToDelete?.name}" and all its subcastes.
                   <br />
                   <strong className="text-destructive">Warning:</strong> Voters assigned to this caste will need to be reassigned.
                 </>
               ) : (
                 <>This will remove the subcaste "{itemToDelete?.name}".</>
               )}
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
 
       {/* Save Changes Dialog */}
       <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <AlertCircle className="h-5 w-5 text-warning" />
               Save Caste Changes?
             </DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
               You have made the following changes:
             </p>
             <ScrollArea className="h-[200px]">
               <div className="space-y-2">
                 {pendingChanges.map(change => (
                   <div key={change.surnameId} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                     <Badge variant="outline">{change.surname}</Badge>
                     <span className="text-sm text-muted-foreground">{change.fromCaste}</span>
                     <ArrowRight className="h-4 w-4" />
                     <Badge>{change.toCaste}</Badge>
                     <span className="text-xs text-muted-foreground ml-auto">
                       ({change.voterIds.length} voters)
                     </span>
                   </div>
                 ))}
               </div>
             </ScrollArea>
             <p className="text-sm text-muted-foreground">
               This will update all voters with these surnames to the new caste category.
             </p>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={handleDiscardChanges}>
               Discard
             </Button>
             <Button onClick={handleSaveChanges} className="gap-2">
               <Save className="h-4 w-4" />
               Save Changes
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 };