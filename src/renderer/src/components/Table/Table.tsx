import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Icon } from "../Icon/Icon";
import "./Table.css";

export type SortDirection = "ascending" | "descending";

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  /** Numbers: JetBrains Mono, tabular-nums, right-aligned. */
  numeric?: boolean;
  sortable?: boolean;
  render(row: T): ReactNode;
  /** Value to sort by; needed for sortable columns. */
  sortValue?(row: T): string | number;
}

export interface TableSort {
  key: string;
  direction: SortDirection;
}

export interface TableProps<T> {
  caption: ReactNode;
  rows: readonly T[];
  rowKey(row: T): string;
  columns: readonly TableColumn<T>[];
  initialSort?: TableSort;
  className?: string;
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "de");
}

export function Table<T>({
  caption,
  rows,
  rowKey,
  columns,
  initialSort,
  className,
}: TableProps<T>) {
  const [sort, setSort] = useState<TableSort | null>(initialSort ?? null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    const value = column?.sortValue;
    if (!value) return rows;
    const factor = sort.direction === "ascending" ? 1 : -1;
    return [...rows].sort((a, b) => factor * compare(value(a), value(b)));
  }, [rows, columns, sort]);

  function toggle(key: string): void {
    setSort((current) =>
      current?.key === key && current.direction === "ascending"
        ? { key, direction: "descending" }
        : { key, direction: "ascending" },
    );
  }

  const classes = ["stl-table", className].filter(Boolean).join(" ");
  return (
    <table className={classes}>
      <caption className="stl-table__caption">{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => {
            const direction = sort?.key === column.key ? sort.direction : undefined;
            const cellClass = column.numeric ? "stl-table__cell--numeric" : undefined;
            return (
              <th
                key={column.key}
                scope="col"
                className={cellClass}
                aria-sort={column.sortable ? (direction ?? "none") : undefined}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    className="stl-table__sort"
                    onClick={() => toggle(column.key)}
                  >
                    {column.header}
                    <Icon
                      icon={
                        direction === "ascending"
                          ? ArrowUp
                          : direction === "descending"
                            ? ArrowDown
                            : ArrowUpDown
                      }
                      size={14}
                    />
                  </button>
                ) : (
                  column.header
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((column) => (
              <td
                key={column.key}
                className={column.numeric ? "stl-table__cell--numeric" : undefined}
              >
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
