"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./search-input";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  /** Hide on mobile (below sm breakpoint) */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: string[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = true,
  searchKeys,
  pageSize = 10,
  onRowClick,
  emptyMessage = "Sin datos",
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    const keys = searchKeys || columns.map((c) => c.key);
    return data.filter((row) =>
      keys.some((k) => {
        const val = row[k];
        if (val == null) return false;
        if (val instanceof Map) {
          return Array.from(val.values()).some((v) => String(v).toLowerCase().includes(q));
        }
        return String(val).toLowerCase().includes(q);
      }),
    );
  }, [data, search, searchKeys, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String(a[sortKey] ?? "");
      const bVal = String(b[sortKey] ?? "");
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {searchable && (
        <SearchInput
          placeholder="Buscar..."
          onSearch={(v) => {
            setSearch(v);
            setPage(0);
          }}
          className="max-w-full sm:max-w-xs"
        />
      )}

      <div className="-mx-4 overflow-x-auto sm:mx-0 sm:rounded-xl sm:border sm:border-glass-border">
        <table className="w-full min-w-0">
          <thead>
            <tr className="border-b border-glass-border bg-surface-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 py-2.5 text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400 sm:px-4 sm:py-3 sm:text-xs",
                    col.sortable && "cursor-pointer select-none hover:text-surface-200",
                    col.hideOnMobile && "hidden sm:table-cell",
                    col.className,
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </th>
              ))}
              {actions && <th className="w-10 px-3 py-2.5 sm:w-12 sm:px-4 sm:py-3" />}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-10 text-center font-mono text-xs text-surface-500 sm:py-12 sm:text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-glass-border/50 transition-colors last:border-0",
                    onRowClick
                      ? "cursor-pointer hover:bg-surface-800/80 active:bg-surface-800"
                      : "hover:bg-surface-800/40",
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-3 py-2.5 font-mono text-xs text-surface-200 sm:px-4 sm:py-3 sm:text-sm",
                        col.hideOnMobile && "hidden sm:table-cell",
                        col.className,
                      )}
                    >
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-surface-400 sm:text-xs">
            {sorted.length} resultado{sorted.length !== 1 && "s"}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono text-[11px] text-surface-300 sm:px-3 sm:text-xs">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
