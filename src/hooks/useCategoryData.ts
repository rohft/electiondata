import { useState, useCallback, useEffect } from "react";
import { CategoryField, CategoryDataMap, FieldOption } from "@/types/categoryData";
import { logError } from "@/lib/errorLogger";

const generateId = () => Math.random().toString(36).substr(2, 9);

const STORAGE_KEY = 'category_data_map';

// Load initial data from localStorage
function loadInitialDataMap(): CategoryDataMap {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    logError('LoadCategoryDataMap', error);
  }
  return {};
}

export function useCategoryData() {
  const [dataMap, setDataMap] = useState<CategoryDataMap>(loadInitialDataMap);

  // Persist dataMap to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataMap));
    } catch (error) {
      logError('SaveCategoryDataMap', error);
    }
  }, [dataMap]);

  const addField = useCallback((categoryId: string, field: Omit<CategoryField, "id">) => {
    const newField: CategoryField = { ...field, id: generateId() };
    setDataMap((prev) => {
      const existing = prev[categoryId] || { fields: [], data: [] };
      return {
        ...prev,
        [categoryId]: {
          ...existing,
          fields: [...existing.fields, newField],
          data: [...existing.data, { fieldId: newField.id, value: newField.type === "multi-select" ? [] : null }]
        }
      };
    });
  }, []);

  const removeField = useCallback((categoryId: string, fieldId: string) => {
    setDataMap((prev) => {
      const existing = prev[categoryId];
      if (!existing) return prev;
      return {
        ...prev,
        [categoryId]: {
          fields: existing.fields.filter((f) => f.id !== fieldId),
          data: existing.data.filter((d) => d.fieldId !== fieldId)
        }
      };
    });
  }, []);

  const updateFieldData = useCallback((categoryId: string, fieldId: string, value: string | string[] | null) => {
    setDataMap((prev) => {
      const existing = prev[categoryId];
      if (!existing) return prev;
      return {
        ...prev,
        [categoryId]: {
          ...existing,
          data: existing.data.map((d) => d.fieldId === fieldId ? { ...d, value } : d)
        }
      };
    });
  }, []);

  const addFieldOption = useCallback((categoryId: string, fieldId: string, label: string) => {
    const newOption: FieldOption = { id: generateId(), label };
    setDataMap((prev) => {
      const existing = prev[categoryId];
      if (!existing) return prev;
      return {
        ...prev,
        [categoryId]: {
          ...existing,
          fields: existing.fields.map((f) =>
          f.id === fieldId ? { ...f, options: [...(f.options || []), newOption] } : f
          )
        }
      };
    });
  }, []);

  const removeFieldOption = useCallback((categoryId: string, fieldId: string, optionId: string) => {
    setDataMap((prev) => {
      const existing = prev[categoryId];
      if (!existing) return prev;
      return {
        ...prev,
        [categoryId]: {
          ...existing,
          fields: existing.fields.map((f) =>
          f.id === fieldId ? { ...f, options: (f.options || []).filter((o) => o.id !== optionId) } : f
          )
        }
      };
    });
  }, []);

  const getFieldsForCategory = useCallback(
    (categoryId: string) => dataMap[categoryId] || { fields: [], data: [] },
    [dataMap]
  );

  return {
    dataMap,
    addField,
    removeField,
    updateFieldData,
    addFieldOption,
    removeFieldOption,
    getFieldsForCategory
  };
}