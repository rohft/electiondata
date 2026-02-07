import { useState, useCallback } from "react";
import { Category } from "@/types/category";

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultCategories: Category[] = [];


function findAndUpdate(
categories: Category[],
id: string,
updater: (cat: Category) => Category | null)
: Category[] {
  return categories.
  map((cat) => {
    if (cat.id === id) {
      return updater(cat);
    }
    return { ...cat, children: findAndUpdate(cat.children, id, updater) };
  }).
  filter(Boolean) as Category[];
}

function addChildTo(categories: Category[], parentId: string, child: Category): Category[] {
  return categories.map((cat) => {
    if (cat.id === parentId) {
      return { ...cat, children: [...cat.children, child] };
    }
    return { ...cat, children: addChildTo(cat.children, parentId, child) };
  });
}

function flattenCategories(categories: Category[], depth = 0): {cat: Category;depth: number;}[] {
  const result: {cat: Category;depth: number;}[] = [];
  for (const cat of categories) {
    result.push({ cat, depth });
    result.push(...flattenCategories(cat.children, depth + 1));
  }
  return result;
}

function findCatById(categories: Category[], id: string): Category | null {
  for (const cat of categories) {
    if (cat.id === id) return cat;
    const found = findCatById(cat.children, id);
    if (found) return found;
  }
  return null;
}

export function useCategoryTree() {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addCategory = useCallback((parentId: string | null, name: string) => {
    const newCat: Category = {
      id: generateId(),
      name,
      parentId,
      linkedIds: [],
      children: []
    };
    if (parentId === null) {
      setCategories((prev) => [...prev, newCat]);
    } else {
      setCategories((prev) => addChildTo(prev, parentId, newCat));
    }
  }, []);

  const renameCategory = useCallback((id: string, newName: string) => {
    setCategories((prev) =>
    findAndUpdate(prev, id, (cat) => ({ ...cat, name: newName }))
    );
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length !== prev.length) return filtered;
      return findAndUpdate(prev, id, () => null);
    });
    setSelectedId((prev) => prev === id ? null : prev);
  }, []);

  const bulkUpload = useCallback((text: string, parentId: string | null) => {
    const lines = text.split("\n").filter((l) => l.trim());
    const stack: {id: string;indent: number;}[] = [];

    for (const line of lines) {
      const indent = line.search(/\S/);
      const name = line.trim();
      if (!name) continue;

      const newId = generateId();

      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const actualParentId = stack.length > 0 ? stack[stack.length - 1].id : parentId;

      const newCat: Category = { id: newId, name, parentId: actualParentId, linkedIds: [], children: [] };

      if (actualParentId === null) {
        setCategories((prev) => [...prev, newCat]);
      } else {
        setCategories((prev) => addChildTo(prev, actualParentId, newCat));
      }

      stack.push({ id: newId, indent });
    }
  }, []);

  const linkCategory = useCallback((sourceId: string, targetId: string, linkName: string = "") => {
    setCategories((prev) => {
      const sourceCat = findCatById(prev, sourceId);
      const targetCat = findCatById(prev, targetId);
      const name = linkName || `${sourceCat?.name ?? ""} ↔ ${targetCat?.name ?? ""}`;

      let updated = findAndUpdate(prev, sourceId, (cat) => ({
        ...cat,
        linkedIds: cat.linkedIds.some((l) => l.id === targetId) ?
        cat.linkedIds :
        [...cat.linkedIds, { id: targetId, name }]
      }));
      updated = findAndUpdate(updated, targetId, (cat) => ({
        ...cat,
        linkedIds: cat.linkedIds.some((l) => l.id === sourceId) ?
        cat.linkedIds :
        [...cat.linkedIds, { id: sourceId, name }]
      }));
      return updated;
    });
  }, []);

  const unlinkCategory = useCallback((sourceId: string, targetId: string) => {
    setCategories((prev) => {
      let updated = findAndUpdate(prev, sourceId, (cat) => ({
        ...cat,
        linkedIds: cat.linkedIds.filter((l) => l.id !== targetId)
      }));
      updated = findAndUpdate(updated, targetId, (cat) => ({
        ...cat,
        linkedIds: cat.linkedIds.filter((l) => l.id !== sourceId)
      }));
      return updated;
    });
  }, []);

  const renameLinkCategory = useCallback((sourceId: string, targetId: string, newName: string) => {
    setCategories((prev) => {
      let updated = findAndUpdate(prev, sourceId, (cat) => ({
        ...cat,
        linkedIds: cat.linkedIds.map((l) => l.id === targetId ? { ...l, name: newName } : l)
      }));
      updated = findAndUpdate(updated, targetId, (cat) => ({
        ...cat,
        linkedIds: cat.linkedIds.map((l) => l.id === sourceId ? { ...l, name: newName } : l)
      }));
      return updated;
    });
  }, []);

  const getAllTags = useCallback((): {cat: Category;depth: number;}[] => {
    return flattenCategories(categories);
  }, [categories]);

  return {
    categories,
    selectedId,
    setSelectedId,
    addCategory,
    renameCategory,
    deleteCategory,
    bulkUpload,
    getAllTags,
    linkCategory,
    unlinkCategory,
    renameLinkCategory
  };
}