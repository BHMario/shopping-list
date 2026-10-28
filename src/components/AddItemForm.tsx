import type { FormEvent } from 'react';

type AddItemFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  error: string | null;
  statusMessage: string | null;
};

export function AddItemForm({ value, onChange, onSubmit, error, statusMessage }: AddItemFormProps) {
  return (
    <form className="add-form" onSubmit={onSubmit} noValidate>
      <label className="sr-only" htmlFor="shopping-item-input">
        Añadir producto
      </label>
      <div className="add-form__controls">
        <input
          id="shopping-item-input"
          name="shopping-item"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ej. Leche, pan, fruta..."
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'shopping-item-error' : undefined}
        />
        <button type="submit">Añadir</button>
      </div>
      {error ? (
        <p id="shopping-item-error" className="form-message form-message--error" role="alert">
          {error}
        </p>
      ) : null}
      {statusMessage ? <p className="form-message form-message--success">{statusMessage}</p> : null}
    </form>
  );
}
