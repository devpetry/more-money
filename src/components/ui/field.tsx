import * as React from "react";

import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  // Elemento ao lado do rótulo (ex.: botão de atalho)
  action?: React.ReactNode;
  className?: string;
  children: React.ReactElement<React.InputHTMLAttributes<HTMLElement>>;
}

// Rótulo + controle + dica/erro, ligando id, aria-invalid e aria-describedby.
export function Field({
  id,
  label,
  error,
  hint,
  action,
  className,
  children,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {action}
      </div>

      {React.cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}

      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
