import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { db } from './db/database';

describe('Shopping list app', () => {
  beforeEach(async () => {
    await db.shoppingItems.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  it('adds a valid product', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/añadir producto/i), 'Leche');
    await user.click(screen.getByRole('button', { name: /añadir/i }));

    expect(await screen.findByText('Leche')).toBeInTheDocument();
  });

  it('rejects empty products', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/añadir producto/i), '   ');
    await user.click(screen.getByRole('button', { name: /añadir/i }));

    expect(screen.getByText(/el nombre del producto no puede estar vacío/i)).toBeInTheDocument();
  });

  it('marks and unmarks a product as bought', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/añadir producto/i), 'Pan');
    await user.click(screen.getByRole('button', { name: /añadir/i }));

    const checkbox = await screen.findByLabelText(/marcar pan como comprado/i);
    await user.click(checkbox);
    expect(await screen.findByLabelText(/desmarcar pan como comprado/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/desmarcar pan como comprado/i));
    expect(screen.getByLabelText(/marcar pan como comprado/i)).toBeInTheDocument();
  });

  it('deletes a product', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/añadir producto/i), 'Aceite');
    await user.click(screen.getByRole('button', { name: /añadir/i }));

    await user.click(await screen.findByRole('button', { name: /eliminar aceite/i }));

    expect(screen.queryByText('Aceite')).not.toBeInTheDocument();
  });

  it('deletes all bought products', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/añadir producto/i), 'Tomates');
    await user.click(screen.getByRole('button', { name: /añadir/i }));
    await user.type(screen.getByLabelText(/añadir producto/i), 'Patatas');
    await user.click(screen.getByRole('button', { name: /añadir/i }));

    await user.click((await screen.findAllByLabelText(/marcar .* como comprado/i))[0]);
    await user.click(screen.getByRole('button', { name: /borrar comprados/i }));
    await user.click(screen.getByRole('button', { name: /eliminar comprados/i }));

    await waitFor(() => {
      expect(screen.queryByText('Tomates')).not.toBeInTheDocument();
      expect(screen.getByText('Patatas')).toBeInTheDocument();
    });
  });

  it('keeps data after reloading the app', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.type(screen.getByLabelText(/añadir producto/i), 'Yogur');
    await user.click(screen.getByRole('button', { name: /añadir/i }));

    unmount();
    render(<App />);

    expect(await screen.findByText('Yogur')).toBeInTheDocument();
  });

  it('exports a valid backup file', async () => {
    const user = userEvent.setup();
    render(<App />);

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:mock-url'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    await user.type(screen.getByLabelText(/añadir producto/i), 'Pasta');
    await user.click(screen.getByRole('button', { name: /añadir/i }));
    await user.click(screen.getByRole('button', { name: /exportar json/i }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('rejects malformed import files', async () => {
    render(<App />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(['{broken json'], 'bad.json', { type: 'application/json' });

    fireEvent.change(fileInput, { target: { files: [badFile] } });

    expect(await screen.findByText(/la estructura del archivo no es válida|la versión del archivo no es compatible|el archivo no contiene una lista de productos válida/i)).toBeInTheDocument();
  });

  it('combines imports without duplicating products by id', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/añadir producto/i), 'Aguacate');
    await user.click(screen.getByRole('button', { name: /añadir/i }));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const importedPayload = {
      version: 1,
      exportedAt: '2026-10-28T00:00:00.000Z',
      items: [
        { id: 'existing-id', name: 'Aguacate', checked: false, createdAt: 1, updatedAt: 1 },
        { id: 'new-id', name: 'Zanahorias', checked: false, createdAt: 2, updatedAt: 2 },
      ],
    };

    fireEvent.change(fileInput, {
      target: {
        files: [new File([JSON.stringify(importedPayload)], 'import.json', { type: 'application/json' })],
      },
    });

    expect(await screen.findByText('Aguacate')).toBeInTheDocument();
    expect(await screen.findByText('Zanahorias')).toBeInTheDocument();
  });

  it('replaces the list using a transaction', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/añadir producto/i), 'Queso');
    await user.click(screen.getByRole('button', { name: /añadir/i }));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const replacement = {
      version: 1,
      exportedAt: '2026-10-28T00:00:00.000Z',
      items: [{ id: 'replacement-1', name: 'Leche', checked: false, createdAt: 2, updatedAt: 2 }],
    };

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: /reemplazar lista/i }));
    fireEvent.change(fileInput, {
      target: {
        files: [new File([JSON.stringify(replacement)], 'replace.json', { type: 'application/json' })],
      },
    });

    expect(await screen.findByText('Leche')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Queso')).not.toBeInTheDocument();
    });
  });

  it('shows an offline message when the browser reports no connection', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    });

    render(<App />);

    expect(screen.getByText(/sin conexión/i)).toBeInTheDocument();
  });

  it('handles storage errors gracefully', async () => {
    const user = userEvent.setup();
    render(<App />);

    const originalAdd = db.shoppingItems.add.bind(db.shoppingItems);
    vi.spyOn(db.shoppingItems, 'add').mockRejectedValueOnce(new Error('Storage blocked'));

    await user.type(screen.getByLabelText(/añadir producto/i), 'Huevos');
    await user.click(screen.getByRole('button', { name: /añadir/i }));

    expect(screen.getByText(/no se pudo guardar el producto/i)).toBeInTheDocument();
    vi.spyOn(db.shoppingItems, 'add').mockRestore();
    expect(originalAdd).toBeInstanceOf(Function);
  });
});
