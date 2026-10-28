import type { ShoppingItem as ShoppingItemType } from '../types/shopping';
import { EmptyState } from './EmptyState';
import { ShoppingItem } from './ShoppingItem';

type ShoppingListProps = {
  items: ShoppingItemType[];
  onToggle: (id: string, checked: boolean) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
};

export function ShoppingList({ items, onToggle, onDelete }: ShoppingListProps) {
  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="shopping-list" aria-label="Lista de la compra">
      {items.map((item) => (
        <ShoppingItem key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  );
}
