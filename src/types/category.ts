export interface CategoryLink {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children: Category[];
  linkedIds: CategoryLink[];
}

export type FlatCategory = Omit<Category, 'children'>;
