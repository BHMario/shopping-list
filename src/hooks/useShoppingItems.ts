import { useLiveQuery } from 'dexie-react-hooks';

import { db, fromStoredShoppingItem } from '../db/database';
import type { ShoppingItem } from '../types/shopping';

export function useShoppingItems(): ShoppingItem[] {
  const items = useLiveQuery(() => db.shoppingItems.orderBy('createdAt').toArray(), []);

  return (items ?? []).map((item) => fromStoredShoppingItem(item));
}
