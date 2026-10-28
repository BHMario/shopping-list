export function EmptyState() {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <h2>La lista está vacía</h2>
      <p>Añade el primer producto para empezar tu compra.</p>
    </div>
  );
}
