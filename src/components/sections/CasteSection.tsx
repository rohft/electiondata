 import React, { useState, useMemo, useCallback, useRef } from 'react';
 import { useVoterData, VoterRecord } from '@/contexts/VoterDataContext';
 import { useCustomTags } from '@/contexts/CustomTagsContext';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Checkbox } from '@/components/ui/checkbox';
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
 } from '@/components/ui/context-menu';
 import {
   FolderOpen,
   FolderClosed,
   ChevronRight,
   ChevronDown,
   Plus,
   Trash2,
   Edit3,
   User,
   Search,
   GripVertical,
   AlertCircle,
   Save,
   RotateCcw,
   FolderTree,
   FolderPlus,
   Download,
   Upload,
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { CASTE_CATEGORIES, detectCasteFromName } from '@/lib/casteData';
 import { toast } from 'sonner';
 
 /* ============ DATA TYPES ============ */
 interface TreeNode {
   id: string;
   name: string;
   type: 'folder' | 'surname';
   voterCount: number;
   voterIds: string[];
   children: TreeNode[];
   parentId: string | null;
   path: string;
 }
 
 interface PendingChange {
   surnameId: string;
   surname: string;
   fromPath: string;
   toPath: string;
   voterIds: string[];
 }
 
 /* ============ HELPER FUNCTIONS ============ */
 const buildTreeFromVoters = (
   voters: VoterRecord[],
   casteCategories: typeof CASTE_CATEGORIES,
   visibleCastes: string[],
   casteHierarchy: Record<string, { subfolders: string[]; surnames: string[] }>
 ): TreeNode[] => {
   const rootNodes: TreeNode[] = [];
 
   // Build caste folders from visible castes + Other
   const allCastes = [...new Set([...visibleCastes, 'Other'])];
 
   allCastes.forEach((casteName) => {
     const cat = casteCategories.find((c) => c.name === casteName);
     const hierarchy = casteHierarchy[casteName] || { subfolders: [], surnames: [] };
     
     const folderNode: TreeNode = {
       id: casteName,
       name: cat ? `${casteName} (${cat.nameNe})` : casteName,
       type: 'folder',
       voterCount: 0,
       voterIds: [],
       children: [],
       parentId: null,
       path: casteName,
     };
 
     // Add subfolders recursively
     const addSubfolders = (parent: TreeNode, subfolders: string[], depth: number) => {
       subfolders.forEach((sub) => {
         const subNode: TreeNode = {
           id: `${parent.path}/${sub}`,
           name: sub,
           type: 'folder',
           voterCount: 0,
           voterIds: [],
           children: [],
           parentId: parent.id,
           path: `${parent.path}/${sub}`,
         };
         parent.children.push(subNode);
       });
     };
 
     addSubfolders(folderNode, hierarchy.subfolders, 1);
     rootNodes.push(folderNode);
   });
 
   // Group voters by surname + caste
   const surnameMap: Record<string, { caste: string; voterIds: string[] }> = {};
   voters.forEach((v) => {
     const detected = detectCasteFromName(v.fullName);
     const caste = v.caste || detected.caste || 'Other';
     const surname = v.surname || detected.surname || 'Unknown';
     const key = `${surname}__${caste}`;
     if (!surnameMap[key]) surnameMap[key] = { caste, voterIds: [] };
     surnameMap[key].voterIds.push(v.id);
   });
 
   // Place surnames into folders
   Object.entries(surnameMap).forEach(([key, { caste, voterIds }]) => {
     const surname = key.split('__')[0];
     const folder = rootNodes.find((n) => n.id === caste);
     if (folder) {
       folder.children.push({
         id: key,
         name: surname,
         type: 'surname',
         voterCount: voterIds.length,
         voterIds,
         children: [],
         parentId: folder.id,
         path: `${folder.path}/${surname}`,
       });
       folder.voterCount += voterIds.length;
     }
   });
 
   // Sort children by count
   rootNodes.forEach((n) => n.children.sort((a, b) => b.voterCount - a.voterCount));
 
   return rootNodes.filter((n) => n.voterCount > 0 || visibleCastes.includes(n.id));
 };
 
 /* ============ TREE NODE COMPONENT ============ */
 const TreeNodeItem: React.FC<{
   node: TreeNode;
   depth: number;
   selectedIds: Set<string>;
   expandedIds: Set<string>;
   lastSelectedId: string | null;
   onToggleExpand: (id: string) => void;
   onSelect: (id: string, e: React.MouseEvent) => void;
   onRename: (node: TreeNode) => void;
   onDelete: (node: TreeNode) => void;
   onAddSubfolder: (parent: TreeNode) => void;
   onMoveSelected: (targetFolder: TreeNode) => void;
   flatList: TreeNode[];
 }> = ({
   node,
   depth,
   selectedIds,
   expandedIds,
   onToggleExpand,
   onSelect,
   onRename,
   onDelete,
   onAddSubfolder,
   onMoveSelected,
   flatList,
 }) => {
   const isExpanded = expandedIds.has(node.id);
   const isSelected = selectedIds.has(node.id);
   const isFolder = node.type === 'folder';
 
   const handleClick = (e: React.MouseEvent) => {
     if (isFolder) {
       onToggleExpand(node.id);
     }
     onSelect(node.id, e);
   };
 
   return (
     <ContextMenu>
       <ContextMenuTrigger asChild>
         <div>
           <div
             style={{ paddingLeft: `${depth * 16 + 8}px` }}
             className={cn(
               'flex items-center gap-2 py-1.5 pr-2 rounded-md cursor-pointer transition-all select-none',
               'hover:bg-muted/50',
               isSelected && 'bg-primary/10 ring-1 ring-primary'
             )}
             onClick={handleClick}
           >
             {isFolder ? (
               <>
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
               </>
             ) : (
               <>
                 <GripVertical className="h-3 w-3 text-muted-foreground ml-1" />
                 <User className="h-3 w-3 text-muted-foreground" />
               </>
             )}
             <span className={cn('flex-1 text-sm', isFolder && 'font-medium')}>{node.name}</span>
             <Badge variant="secondary" className="text-xs">
               {node.voterCount}
             </Badge>
           </div>
           {isFolder && isExpanded && node.children.length > 0 && (
             <div>
               {node.children.map((child) => (
                 <TreeNodeItem
                   key={child.id}
                   node={child}
                   depth={depth + 1}
                   selectedIds={selectedIds}
                   expandedIds={expandedIds}
                   lastSelectedId={null}
                   onToggleExpand={onToggleExpand}
                   onSelect={onSelect}
                   onRename={onRename}
                   onDelete={onDelete}
                   onAddSubfolder={onAddSubfolder}
                   onMoveSelected={onMoveSelected}
                   flatList={flatList}
                 />
               ))}
             </div>
           )}
         </div>
       </ContextMenuTrigger>
       <ContextMenuContent className="w-48">
         {isFolder && (
           <>
             <ContextMenuItem onClick={() => onAddSubfolder(node)}>
               <FolderPlus className="h-4 w-4 mr-2" />
               Add Subfolder
             </ContextMenuItem>
             {selectedIds.size > 0 && !selectedIds.has(node.id) && (
               <ContextMenuItem onClick={() => onMoveSelected(node)}>
                 <Plus className="h-4 w-4 mr-2" />
                 Move {selectedIds.size} selected here
               </ContextMenuItem>
             )}
           </>
         )}
         <ContextMenuItem onClick={() => onRename(node)}>
           <Edit3 className="h-4 w-4 mr-2" />
           Rename
         </ContextMenuItem>
         <ContextMenuSeparator />
         <ContextMenuItem onClick={() => onDelete(node)} className="text-destructive">
           <Trash2 className="h-4 w-4 mr-2" />
           Delete
         </ContextMenuItem>
       </ContextMenuContent>
     </ContextMenu>
   );
 };
 
 /* ============ MAIN COMPONENT ============ */
 export const CasteSection = () => {
   const { municipalities, updateVoterRecord } = useVoterData();
   const { 
     tags, 
     addCaste, 
     removeCaste, 
     renameCaste, 
     addSubfolder, 
     removeSubfolder,
     getVisibleCastes,
     importCasteData,
     exportCasteData
   } = useCustomTags();
 
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   // UI state
   const [searchTerm, setSearchTerm] = useState('');
   const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
   const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
   const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
 
   // Dialog state
   const [showAddFolderDialog, setShowAddFolderDialog] = useState(false);
   const [showRenameDialog, setShowRenameDialog] = useState(false);
   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
   const [showSaveDialog, setShowSaveDialog] = useState(false);
   const [dialogTarget, setDialogTarget] = useState<TreeNode | null>(null);
   const [newFolderName, setNewFolderName] = useState('');
   const [renameTo, setRenameTo] = useState('');
 
   // Pending changes
   const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
 
   // Build flat voter list
   const allVoters = useMemo(
     () => municipalities.flatMap((m) => m.wards.flatMap((w) => w.voters)),
     [municipalities]
   );
 
   // Get visible castes
   const visibleCastes = useMemo(() => getVisibleCastes(), [getVisibleCastes]);
 
   // Build tree
   const treeData = useMemo(() => {
     return buildTreeFromVoters(allVoters, CASTE_CATEGORIES, visibleCastes, tags.casteHierarchy);
   }, [allVoters, visibleCastes, tags.casteHierarchy]);
 
   // Flat list for shift-select range
   const flatList = useMemo(() => {
     const list: TreeNode[] = [];
     const traverse = (nodes: TreeNode[]) => {
       nodes.forEach((n) => {
         list.push(n);
         if (expandedIds.has(n.id) && n.children.length > 0) traverse(n.children);
       });
     };
     traverse(treeData);
     return list;
   }, [treeData, expandedIds]);
 
   // Filter tree
   const filteredTree = useMemo(() => {
     if (!searchTerm.trim()) return treeData;
     const term = searchTerm.toLowerCase();
     const filter = (nodes: TreeNode[]): TreeNode[] =>
       nodes
         .map((n) => ({
           ...n,
           children: filter(n.children),
         }))
         .filter((n) => n.name.toLowerCase().includes(term) || n.children.length > 0);
     return filter(treeData);
   }, [treeData, searchTerm]);
 
   // Toggle expand
   const handleToggleExpand = useCallback((id: string) => {
     setExpandedIds((prev) => {
       const next = new Set(prev);
       next.has(id) ? next.delete(id) : next.add(id);
       return next;
     });
   }, []);
 
   // Select with Shift/Ctrl support
   const handleSelect = useCallback(
     (id: string, e: React.MouseEvent) => {
       if (e.shiftKey && lastSelectedId) {
         const startIdx = flatList.findIndex((n) => n.id === lastSelectedId);
         const endIdx = flatList.findIndex((n) => n.id === id);
         if (startIdx !== -1 && endIdx !== -1) {
           const range = flatList.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
           setSelectedIds((prev) => new Set([...prev, ...range.map((n) => n.id)]));
           return;
         }
       }
       if (e.ctrlKey || e.metaKey) {
         setSelectedIds((prev) => {
           const next = new Set(prev);
           next.has(id) ? next.delete(id) : next.add(id);
           return next;
         });
       } else {
         setSelectedIds(new Set([id]));
       }
       setLastSelectedId(id);
     },
     [flatList, lastSelectedId]
   );
 
   // Expand/Collapse all
   const expandAll = () => setExpandedIds(new Set(flatList.map((n) => n.id)));
   const collapseAll = () => setExpandedIds(new Set());
 
   // CRUD handlers
   const handleAddSubfolder = (parent: TreeNode) => {
     setDialogTarget(parent);
     setNewFolderName('');
     setShowAddFolderDialog(true);
   };
 
   const confirmAddSubfolder = () => {
     if (!newFolderName.trim()) return;
     if (dialogTarget) {
       addSubfolder(dialogTarget.id, newFolderName.trim());
     } else {
       addCaste(newFolderName.trim());
     }
     toast.success(`Folder "${newFolderName}" added`);
     setShowAddFolderDialog(false);
     setNewFolderName('');
   };
 
   const handleRename = (node: TreeNode) => {
     setDialogTarget(node);
     setRenameTo(node.name.split(' (')[0]); // Remove Nepali name suffix
     setShowRenameDialog(true);
   };
 
   const confirmRename = () => {
     if (!dialogTarget || !renameTo.trim()) return;
     if (dialogTarget.parentId === null) {
       renameCaste(dialogTarget.id, renameTo.trim());
     }
     toast.success(`Renamed to "${renameTo}"`);
     setShowRenameDialog(false);
   };
 
   const handleDelete = (node: TreeNode) => {
     setDialogTarget(node);
     setShowDeleteDialog(true);
   };
 
   const confirmDelete = () => {
     if (!dialogTarget) return;
     if (dialogTarget.type === 'folder') {
       if (dialogTarget.parentId) {
         // It's a subfolder
         removeSubfolder(dialogTarget.parentId, dialogTarget.name);
       } else {
         // It's a root caste folder
         removeCaste(dialogTarget.id);
       }
     }
     toast.success(`Deleted "${dialogTarget.name}"`);
     setShowDeleteDialog(false);
     setDialogTarget(null);
   };
 
   // Move selected into folder
   const handleMoveSelected = (targetFolder: TreeNode) => {
     const selected = flatList.filter((n) => selectedIds.has(n.id) && n.type === 'surname');
     if (selected.length === 0) return;
     selected.forEach((s) => {
       setPendingChanges((prev) => [
         ...prev.filter((c) => c.surnameId !== s.id),
         {
           surnameId: s.id,
           surname: s.name,
           fromPath: s.parentId || 'Unknown',
           toPath: targetFolder.id,
           voterIds: s.voterIds,
         },
       ]);
     });
     setSelectedIds(new Set());
     toast.info(`${selected.length} surname(s) staged for move`);
   };
 
   // Save changes
   const handleSaveChanges = () => {
     let count = 0;
     pendingChanges.forEach((change) => {
       change.voterIds.forEach((vid) => {
         for (const m of municipalities) {
           for (const w of m.wards) {
             const v = w.voters.find((voter) => voter.id === vid);
             if (v) {
               updateVoterRecord(m.id, w.id, vid, { caste: change.toPath });
               count++;
             }
           }
         }
       });
     });
     toast.success(`Updated ${count} voter records`);
     setPendingChanges([]);
     setShowSaveDialog(false);
   };
 
   const handleDiscardChanges = () => {
     setPendingChanges([]);
     setShowSaveDialog(false);
   };
 
   // Import/Export
   const handleExport = () => {
     const data = exportCasteData();
     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'caste-hierarchy.json';
     a.click();
     URL.revokeObjectURL(url);
     toast.success('Caste hierarchy exported');
   };
 
   const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     
     const reader = new FileReader();
     reader.onload = (event) => {
       try {
         const data = JSON.parse(event.target?.result as string);
         importCasteData(data);
         toast.success('Caste hierarchy imported');
       } catch (err) {
         toast.error('Failed to parse import file');
       }
     };
     reader.readAsText(file);
     if (fileInputRef.current) {
       fileInputRef.current.value = '';
     }
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
         <CardContent className="space-y-4">
           <div className="flex flex-wrap items-center gap-4">
             <div className="relative flex-1 min-w-[200px]">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input
                 placeholder="Search folders or surnames..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-9"
               />
             </div>
             <div className="flex items-center gap-2 flex-wrap">
               <Button variant="outline" size="sm" onClick={expandAll}>
                 Expand All
               </Button>
               <Button variant="outline" size="sm" onClick={collapseAll}>
                 Collapse All
               </Button>
               <Button size="sm" onClick={() => { setDialogTarget(null); setNewFolderName(''); setShowAddFolderDialog(true); }} className="gap-2">
                 <Plus className="h-4 w-4" />
                 Add Caste
               </Button>
               <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                 <Download className="h-4 w-4" />
                 Export
               </Button>
               <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                 <Upload className="h-4 w-4" />
                 Import
               </Button>
               <input
                 ref={fileInputRef}
                 type="file"
                 accept=".json"
                 className="hidden"
                 onChange={handleImport}
               />
             </div>
           </div>
 
           {/* Pending changes */}
           {pendingChanges.length > 0 && (
             <div className="flex items-center gap-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
               <AlertCircle className="h-5 w-5 text-warning" />
               <span className="text-sm">
                 {pendingChanges.length} pending move(s) affecting{' '}
                 {pendingChanges.reduce((a, c) => a + c.voterIds.length, 0)} voters
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
 
           {/* Selection info */}
           {selectedIds.size > 0 && (
             <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
               <Checkbox checked={true} className="pointer-events-none" />
               <span className="text-sm">{selectedIds.size} item(s) selected (Ctrl+Click to multi-select, Shift+Click for range)</span>
               <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())} className="ml-auto">
                 Clear
               </Button>
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Tree */}
       <Card className="card-shadow border-border/50">
         <CardContent className="p-4">
           <ScrollArea className="h-[600px]">
             <div className="pr-4 space-y-0.5">
               {filteredTree.map((node) => (
                 <TreeNodeItem
                   key={node.id}
                   node={node}
                   depth={0}
                   selectedIds={selectedIds}
                   expandedIds={expandedIds}
                   lastSelectedId={lastSelectedId}
                   onToggleExpand={handleToggleExpand}
                   onSelect={handleSelect}
                   onRename={handleRename}
                   onDelete={handleDelete}
                   onAddSubfolder={handleAddSubfolder}
                   onMoveSelected={handleMoveSelected}
                   flatList={flatList}
                 />
               ))}
               {filteredTree.length === 0 && (
                 <div className="text-center py-12 text-muted-foreground">
                   <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                   <p>No castes found. Upload voter data or add a caste folder.</p>
                 </div>
               )}
             </div>
           </ScrollArea>
         </CardContent>
       </Card>
 
       {/* Add Folder Dialog */}
       <Dialog open={showAddFolderDialog} onOpenChange={setShowAddFolderDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>
               {dialogTarget ? `Add Subfolder to ${dialogTarget.name}` : 'Add New Caste'}
             </DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Folder Name</Label>
               <Input
                 value={newFolderName}
                 onChange={(e) => setNewFolderName(e.target.value)}
                 placeholder="e.g., Brahmin"
               />
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild>
               <Button variant="outline">Cancel</Button>
             </DialogClose>
             <Button onClick={confirmAddSubfolder}>Add</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Rename Dialog */}
       <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Rename</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>New Name</Label>
               <Input
                 value={renameTo}
                 onChange={(e) => setRenameTo(e.target.value)}
                 placeholder={dialogTarget?.name || ''}
               />
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild>
               <Button variant="outline">Cancel</Button>
             </DialogClose>
             <Button onClick={confirmRename}>Rename</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Delete Confirmation */}
       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle className="flex items-center gap-2">
               <AlertCircle className="h-5 w-5 text-destructive" />
               Delete {dialogTarget?.type === 'folder' ? 'Folder' : 'Surname'}?
             </AlertDialogTitle>
             <AlertDialogDescription>
               {dialogTarget?.type === 'folder'
                 ? `This will remove "${dialogTarget?.name}" and all its contents. Voters will need to be reassigned.`
                 : `This will remove the surname "${dialogTarget?.name}".`}
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={confirmDelete}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
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
               Save Changes?
             </DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
               You are about to move {pendingChanges.length} surname(s) affecting{' '}
               {pendingChanges.reduce((a, c) => a + c.voterIds.length, 0)} voters:
             </p>
             <ScrollArea className="h-[200px]">
               <div className="space-y-2">
                 {pendingChanges.map((c) => (
                   <div key={c.surnameId} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                     <Badge variant="outline">{c.surname}</Badge>
                     <span className="text-muted-foreground">{c.fromPath}</span>
                     <ChevronRight className="h-4 w-4" />
                     <Badge>{c.toPath}</Badge>
                     <span className="text-xs text-muted-foreground ml-auto">({c.voterIds.length} voters)</span>
                   </div>
                 ))}
               </div>
             </ScrollArea>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={handleDiscardChanges}>
               Discard
             </Button>
             <Button onClick={handleSaveChanges} className="gap-2">
               <Save className="h-4 w-4" />
               Save
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 };