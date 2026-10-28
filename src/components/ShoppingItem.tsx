import type { ShoppingItem as ShoppingItemType } from '../types/shopping';

type ShoppingItemProps = {
  item: ShoppingItemType;
  onToggle: (id: string, checked: boolean) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
};

export function ShoppingItem({ item, onToggle, onDelete }: ShoppingItemProps) {
  const checkboxLabel = item.checked ? `Desmarcar ${item.name} como comprado` : `Marcar ${item.name} como comprado`;

  return (
    <li className={`shopping-item ${item.checked ? 'shopping-item--checked' : ''}`}>
      <label className="shopping-item__label">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={() => onToggle(item.id, !item.checked)}
          aria-label={checkboxLabel}
        />
        <span className="shopping-item__name">{item.name}</span>
      </label>
      <button type="button" className="shopping-item__delete" onClick={() => onDelete(item.id)} aria-label={`Eliminar ${item.name}`}>
        Eliminar
      </button>
    </li>
  );
}
