import * as React from "react";
import { AlertCircle, CheckCircle2, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-muted", className)}
      {...props}
    />
  );
}

// Estado de carregamento acessível: esqueleto visual + mensagem para leitores de tela
function LoadingState({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <span className="mb-1 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Mensagem em linha (sucesso/aviso/erro) para formulários e diálogos
function InlineAlert({
  tone,
  children,
  className,
}: {
  tone: "success" | "warning" | "error";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon =
    tone === "success" ? CheckCircle2 : tone === "warning" ? TriangleAlert : AlertCircle;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "warning" && "border-warning/50 bg-warning/10 text-foreground",
        tone === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
        className
      )}
    >
      <Icon
        aria-hidden
        className={cn("mt-0.5 size-4 shrink-0", tone === "warning" && "text-warning")}
      />
      <p className="font-medium">{children}</p>
    </div>
  );
}

export { Skeleton, LoadingState, EmptyState, InlineAlert };
