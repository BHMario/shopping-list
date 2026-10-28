import type { ShoppingItem } from '../types/shopping';

export const BACKUP_FORMAT_VERSION = 1;

export interface BackupPayload {
  version: number;
  exportedAt: string;
  items: ShoppingItem[];
}

export function buildBackupPayload(items: ShoppingItem[]): BackupPayload {
  return {
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    items: items.map((item) => ({ ...item })),
  };
}

export function parseBackupPayload(raw: unknown): BackupPayload {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('La estructura del archivo no es válida.');
  }

  const payload = raw as Record<string, unknown>;

  if (payload.version !== BACKUP_FORMAT_VERSION) {
    throw new Error('La versión del archivo no es compatible con esta aplicación.');
  }

  if (!Array.isArray(payload.items)) {
    throw new Error('El archivo no contiene una lista de productos válida.');
  }

  const items = payload.items.map((item, index) => normalizeImportedItem(item, index));

  return {
    version: BACKUP_FORMAT_VERSION,
    exportedAt: typeof payload.exportedAt === 'string' ? payload.exportedAt : new Date().toISOString(),
    items,
  };
}

export function mergeByStableId(existing: ShoppingItem[], incoming: ShoppingItem[]): ShoppingItem[] {
  const merged = new Map<string, ShoppingItem>();

  existing.forEach((item) => {
    merged.set(item.id, { ...item });
  });

  incoming.forEach((item) => {
    if (!merged.has(item.id)) {
      merged.set(item.id, { ...item });
    }
  });

  return Array.from(merged.values()).sort((left, right) => {
    if (left.checked !== right.checked) {
      return Number(left.checked) - Number(right.checked);
    }

    return left.createdAt - right.createdAt;
  });
}

function normalizeImportedItem(item: unknown, index: number): ShoppingItem {
  if (typeof item !== 'object' || item === null) {
    throw new Error(`El producto en la posición ${index + 1} no tiene un formato válido.`);
  }

  const record = item as Record<string, unknown>;

  const id = ensureString(record.id, 'id');
  const name = ensureString(record.name, 'nombre').trim();
  const checked = ensureBoolean(record.checked, 'comprado');
  const createdAt = ensureFiniteNumber(record.createdAt, 'createdAt');
  const updatedAt = ensureFiniteNumber(record.updatedAt, 'updatedAt');

  if (!name) {
    throw new Error(`El producto en la posición ${index + 1} no tiene un nombre válido.`);
  }

  return {
    id,
    name,
    checked,
    createdAt,
    updatedAt,
  };
}

function ensureString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

function ensureBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`El campo "${fieldName}" debe ser un valor booleano.`);
  }

  return value;
}

function ensureFiniteNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`El campo "${fieldName}" debe ser un número válido.`);
  }

  return value;
}
