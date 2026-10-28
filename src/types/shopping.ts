export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ImportMode = 'merge' | 'replace';
