import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  // Coluna já exibida no título/destaque do cartão mobile
  hideOnCard?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T, index: number) => React.Key;
  // Descreve a tabela para leitores de tela
  caption: string;
  cardTitle: (row: T) => React.ReactNode;
  cardAside?: (row: T) => React.ReactNode;
  actions?: (row: T, layout: "table" | "card") => React.ReactNode;
  empty?: React.ReactNode;
  className?: string;
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

// Tabela a partir de md; abaixo disso, cartões com os mesmos dados e ações.
export function DataTable<T>({
  data,
  columns,
  rowKey,
  caption,
  cardTitle,
  cardAside,
  actions,
  empty,
  className,
}: DataTableProps<T>) {
  if (data.length === 0) return <>{empty}</>;

  const cardColumns = columns.filter((column) => !column.hideOnCard);

  return (
    <div className={className}>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground first:pl-0 last:pr-0",
                    alignClass[column.align ?? "left"],
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th scope="col" className="w-px whitespace-nowrap py-3 pl-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                className="border-b transition-colors last:border-0 hover:bg-muted/50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3.5 align-middle first:pl-0 last:pr-0",
                      alignClass[column.align ?? "left"],
                      column.className
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {actions && (
                  <td className="whitespace-nowrap py-2 pl-4 text-right align-middle">
                    {actions(row, "table")}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={caption} className="divide-y md:hidden">
        {data.map((row, index) => (
          <li key={rowKey(row, index)} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 break-words font-medium">{cardTitle(row)}</p>
              {cardAside && <div className="shrink-0 text-right">{cardAside(row)}</div>}
            </div>
            {cardColumns.length > 0 && (
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                {cardColumns.map((column) => (
                  <React.Fragment key={column.key}>
                    <dt className="text-muted-foreground">{column.header}</dt>
                    <dd className="min-w-0 break-words text-right">{column.cell(row)}</dd>
                  </React.Fragment>
                ))}
              </dl>
            )}
            {actions && (
              <div className="mt-3 flex gap-2">{actions(row, "card")}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Editar/Excluir: ícones na tabela, botões com texto nos cartões mobile
export function RowActions({
  layout,
  itemLabel,
  onEdit,
  onDelete,
}: {
  layout: "table" | "card";
  itemLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const deleteClasses =
    "text-muted-foreground hover:bg-destructive/10 hover:text-destructive";

  if (layout === "card") {
    return (
      <>
        <Button
          variant="outline"
          className="flex-1"
          onClick={onEdit}
          aria-label={`Editar ${itemLabel}`}
        >
          <Pencil aria-hidden />
          Editar
        </Button>
        <Button
          variant="outline"
          className={cn("flex-1", deleteClasses)}
          onClick={onDelete}
          aria-label={`Excluir ${itemLabel}`}
        >
          <Trash2 aria-hidden />
          Excluir
        </Button>
      </>
    );
  }

  return (
    <div className="inline-flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        onClick={onEdit}
        aria-label={`Editar ${itemLabel}`}
        title="Editar"
      >
        <Pencil aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={deleteClasses}
        onClick={onDelete}
        aria-label={`Excluir ${itemLabel}`}
        title="Excluir"
      >
        <Trash2 aria-hidden />
      </Button>
    </div>
  );
}
