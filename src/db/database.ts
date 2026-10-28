import Dexie, { type Table } from 'dexie';

import type { ShoppingItem } from '../types/shopping';

export type StoredShoppingItem = Omit<ShoppingItem, 'checked'> & {
  checked: 0 | 1;
};

export const DATABASE_NAME = 'shopping-list-db';

class ShoppingDatabase extends Dexie {
  shoppingItems!: Table<StoredShoppingItem, string>;

  constructor() {
    super(DATABASE_NAME);
    this.version(1).stores({
      shoppingItems: 'id, checked, createdAt, updatedAt',
    });
  }
}

export const db = new ShoppingDatabase();

export function createShoppingItem(name: string): ShoppingItem {
  const now = Date.now();

  return {
    id: generateId(),
    name: name.trim(),
    checked: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function toStoredShoppingItem(item: ShoppingItem): StoredShoppingItem {
  return {
    ...item,
    checked: item.checked ? 1 : 0,
  };
}

export function fromStoredShoppingItem(item: StoredShoppingItem): ShoppingItem {
  return {
    ...item,
    checked: item.checked === 1,
  };
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
