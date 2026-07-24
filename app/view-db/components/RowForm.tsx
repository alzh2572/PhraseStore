"use client";

import type { ColumnMeta } from "@/lib/view-db/types";
import styles from "../view-db.module.css";

type Props = {
  columns: ColumnMeta[];
  initial?: Record<string, unknown>;
  submitLabel: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
};

export function RowForm({
  columns,
  initial = {},
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <form
      className={styles.form}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const data: Record<string, unknown> = {};
        for (const column of columns) {
          const value = form.get(column.name);
          data[column.name] = value === null ? "" : String(value);
        }
        await onSubmit(data);
      }}
    >
      <div className={styles.formGrid}>
        {columns.map((column) => (
          <label key={column.name} className={styles.field}>
            <span>
              {column.name}
              {column.isPrimaryKey ? " (PK)" : ""}
              {!column.isNullable && !column.hasDefault ? " *" : ""}
            </span>
            <input
              name={column.name}
              defaultValue={
                initial[column.name] == null
                  ? ""
                  : String(initial[column.name])
              }
              placeholder={column.dataType}
            />
          </label>
        ))}
      </div>
      <div className={styles.formActions}>
        <button type="submit" className={styles.btnPrimary}>
          {submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className={styles.btn} onClick={onCancel}>
            Отмена
          </button>
        ) : null}
      </div>
    </form>
  );
}
