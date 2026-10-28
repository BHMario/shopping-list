import type { ShoppingItem } from '../types/shopping';

type ShoppingSummaryProps = {
  items: ShoppingItem[];
};

export function ShoppingSummary({ items }: ShoppingSummaryProps) {
  const pendingCount = items.filter((item) => !item.checked).length;
  const completedCount = items.filter((item) => item.checked).length;

  return (
    <div className="shopping-summary" aria-live="polite">
      <div className="shopping-summary__item">
        <span className="shopping-summary__label">Pendientes</span>
        <strong>{pendingCount}</strong>
      </div>
      <div className="shopping-summary__item shopping-summary__item--checked">
        <span className="shopping-summary__label">Comprados</span>
        <strong>{completedCount}</strong>
      </div>
    </div>
  );
}
