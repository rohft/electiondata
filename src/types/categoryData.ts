export type FieldType = "single-select" | "multi-select" | "photo" | "notes";

export interface FieldOption {
  id: string;
  label: string;
}

export interface CategoryField {
  id: string;
  type: FieldType;
  label: string;
  options?: FieldOption[];
}

export interface CategoryDataEntry {
  fieldId: string;
  value: string | string[] | null;
}

export interface CategoryDataMap {
  [categoryId: string]: {
    fields: CategoryField[];
    data: CategoryDataEntry[];
  };
}