import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { AddItemForm } from './components/AddItemForm';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ShoppingList } from './components/ShoppingList';
import { ShoppingSummary } from './components/ShoppingSummary';
import { db, createShoppingItem, fromStoredShoppingItem, toStoredShoppingItem } from './db/database';
import { useShoppingItems } from './hooks/useShoppingItems';
import { buildBackupPayload, mergeByStableId, parseBackupPayload } from './services/backup';
import { isBrowserOnline, requestPersistentStorage } from './services/storage';
import type { ImportMode } from './types/shopping';

export default function App() {
  const items = useShoppingItems();
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(isBrowserOnline());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pendingImportMode, setPendingImportMode] = useState<ImportMode>('merge');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void requestPersistentStorage();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const orderedItems = [...items].sort((left, right) => {
    if (left.checked !== right.checked) {
      return Number(left.checked) - Number(right.checked);
    }

    return left.createdAt - right.createdAt;
  });

  const checkedCount = items.filter((item) => item.checked).length;

  const handleAddItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage('El nombre del producto no puede estar vacío.');
      return;
    }

    try {
      await db.shoppingItems.add(toStoredShoppingItem(createShoppingItem(trimmedName)));
      setName('');
      setErrorMessage(null);
      setStatusMessage('Producto añadido a la lista.');
    } catch {
      setErrorMessage('No se pudo guardar el producto. Revisa el almacenamiento local.');
      setStatusMessage(null);
    }
  };

  const handleToggleItem = async (id: string, checked: boolean) => {
    try {
      await db.shoppingItems.update(id, {
        checked: checked ? 1 : 0,
        updatedAt: Date.now(),
      });
      setStatusMessage(checked ? 'Producto marcado como comprado.' : 'Producto vuelto a pendientes.');
      setErrorMessage(null);
    } catch {
      setErrorMessage('No se pudo actualizar el estado del producto.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await db.shoppingItems.delete(id);
      setStatusMessage('Producto eliminado.');
      setErrorMessage(null);
    } catch {
      setErrorMessage('No se pudo eliminar el producto.');
    }
  };

  const handleClearChecked = async () => {
    if (checkedCount === 0) {
      setStatusMessage('No hay productos comprados para eliminar.');
      return;
    }

    setShowClearConfirm(true);
  };

  const confirmClearChecked = async () => {
    try {
      await db.shoppingItems.where('checked').equals(1).delete();
      setShowClearConfirm(false);
      setStatusMessage('Los productos comprados se han eliminado.');
      setErrorMessage(null);
    } catch {
      setErrorMessage('No se pudieron eliminar los productos comprados.');
      setShowClearConfirm(false);
    }
  };

  const handleExport = () => {
    if (items.length === 0) {
      setStatusMessage('La lista está vacía. Añade productos antes de exportar.');
      return;
    }

    const payload = buildBackupPayload(items);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `lista-compra-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Copia de seguridad exportada correctamente.');
    setErrorMessage(null);
  };

  const openImportDialog = (mode: ImportMode) => {
    setPendingImportMode(mode);
    fileInputRef.current?.click();
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>, mode: ImportMode) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();

      let parsedContent: unknown;
      try {
        parsedContent = JSON.parse(rawText);
      } catch {
        throw new Error('La estructura del archivo no es válida.');
      }

      const payload = parseBackupPayload(parsedContent);

      if (mode === 'replace') {
        const confirmed = window.confirm('¿Seguro que quieres reemplazar toda la lista actual?');
        if (!confirmed) {
          setStatusMessage('Importación cancelada.');
          event.target.value = '';
          return;
        }

        await db.transaction('rw', db.shoppingItems, async () => {
          await db.shoppingItems.clear();
          if (payload.items.length > 0) {
            await db.shoppingItems.bulkPut(payload.items.map((item) => toStoredShoppingItem(item)));
          }
        });

        setStatusMessage('La lista se ha reemplazado correctamente.');
      } else {
        const currentItems = (await db.shoppingItems.toArray()).map((item) => fromStoredShoppingItem(item));
        const mergedItems = mergeByStableId(currentItems, payload.items);

        await db.transaction('rw', db.shoppingItems, async () => {
          await db.shoppingItems.clear();
          if (mergedItems.length > 0) {
            await db.shoppingItems.bulkPut(mergedItems.map((item) => toStoredShoppingItem(item)));
          }
        });

        setStatusMessage('La lista se ha combinado sin duplicar productos por identificador.');
      }

      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'La importación no se pudo completar.';
      setErrorMessage(message);
      setStatusMessage(null);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__identity">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 9h14l-1.2 11H6.2L5 9Z" />
              <path d="m8 9 4-6 4 6" />
              <path d="M9 13v3m6-3v3" />
            </svg>
          </span>
          <div>
            <p className="eyebrow">Tu lista, siempre a mano</p>
            <h1>La compra</h1>
          </div>
        </div>
        <span className={`connection-badge ${isOnline ? 'connection-badge--online' : 'connection-badge--offline'}`}>
          <span className="connection-badge__dot" aria-hidden="true" />
          {isOnline ? 'En línea' : 'Sin conexión'}
        </span>
      </header>

      <main className="app-layout">
        <section className="panel panel--primary">
          <div className="section-heading">
            <p className="eyebrow">Empieza aquí</p>
            <h2>Añade un producto</h2>
          </div>
          <AddItemForm
            value={name}
            onChange={setName}
            onSubmit={handleAddItem}
            error={errorMessage}
            statusMessage={statusMessage}
          />
          <ShoppingSummary items={items} />
        </section>

        <section className="panel panel--secondary">
          <div className="list-heading">
            <div>
              <p className="eyebrow">Tu compra</p>
              <h2>Productos</h2>
            </div>
            <span className="list-heading__count">
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          <ShoppingList items={orderedItems} onToggle={handleToggleItem} onDelete={handleDeleteItem} />

          <div className="backup-section">
            <p className="backup-section__label">Copia de seguridad</p>
            <div className="toolbar" aria-label="Opciones de copia de seguridad">
              <button type="button" className="button button--secondary" onClick={handleExport}>
                Exportar JSON
              </button>
              <button type="button" className="button button--secondary" onClick={() => openImportDialog('merge')}>
                Importar y combinar
              </button>
              <button type="button" className="button button--secondary" onClick={() => openImportDialog('replace')}>
                Reemplazar lista
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={handleClearChecked}
                disabled={checkedCount === 0}
              >
                Borrar comprados
              </button>
            </div>
          </div>
        </section>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        aria-label="Importar lista desde JSON"
        onChange={(event) => {
          void handleImport(event, pendingImportMode);
        }}
      />

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Eliminar productos comprados"
        message="¿Quieres borrar todos los elementos ya marcados como comprados?"
        confirmLabel="Eliminar comprados"
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          void confirmClearChecked();
        }}
      />
    </div>
  );
}
