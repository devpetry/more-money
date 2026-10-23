"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle2, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastTone = "success" | "warning" | "error";
interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

// Store mínimo em módulo: permite chamar toast.* fora de componentes React
let items: ToastItem[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const EMPTY: ToastItem[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function push(tone: ToastTone, message: string) {
  const id = ++nextId;
  items = [...items, { id, tone, message }];
  emit();
  // Avisos e erros ficam até serem fechados, como o alert() que substituem
  if (tone === "success") setTimeout(() => dismiss(id), 5000);
}

export const toast = {
  success: (message: string) => push("success", message),
  warning: (message: string) => push("warning", message),
  error: (message: string) => push("error", message),
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function ToastCard({ item }: { item: ToastItem }) {
  const Icon =
    item.tone === "success" ? CheckCircle2 : item.tone === "warning" ? TriangleAlert : AlertCircle;
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border bg-popover p-4 text-sm text-popover-foreground shadow-lg animate-in fade-in-0 slide-in-from-bottom-2",
        item.tone === "warning" && "border-warning/50"
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "mt-0.5 size-4 shrink-0",
          item.tone === "success" && "text-success",
          item.tone === "warning" && "text-warning",
          item.tone === "error" && "text-destructive"
        )}
      />
      <p className="flex-1 font-medium">{item.message}</p>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Fechar notificação"
        className="touch-target -m-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useSyncExternalStore(
    subscribe,
    () => items,
    () => EMPTY
  );
  const pilhaRef = useRef<HTMLDivElement>(null);

  // Publica a altura ocupada em --toast-offset; o <main> soma esse valor ao
  // padding inferior, então o fim da página nunca fica sob uma notificação.
  useEffect(() => {
    const pilha = pilhaRef.current;
    if (!pilha) return;
    const root = document.documentElement;
    const atualizar = () =>
      root.style.setProperty(
        "--toast-offset",
        items.length ? `${pilha.offsetHeight + 16}px` : "0px"
      );
    atualizar();
    const observer = new ResizeObserver(atualizar);
    observer.observe(pilha);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--toast-offset");
    };
  }, []);

  // Embaixo (centralizado no mobile, à direita a partir de sm): longe da barra
  // superior e da sidebar. Uma região viva persistente por tipo, sem aninhar:
  // status (educada) para sucesso e alert (assertiva) para erro; aria-atomic
  // false anuncia só a mensagem nova, não os erros que continuam na tela.
  return (
    <section
      aria-label="Notificações"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 sm:left-auto sm:justify-end"
    >
      <div ref={pilhaRef} className="flex w-full max-w-sm flex-col gap-2">
        <div role="status" aria-atomic="false" className="flex flex-col gap-2">
          {toasts
            .filter((item) => item.tone !== "error")
            .map((item) => (
              <ToastCard key={item.id} item={item} />
            ))}
        </div>
        <div role="alert" aria-atomic="false" className="flex flex-col gap-2">
          {toasts
            .filter((item) => item.tone === "error")
            .map((item) => (
              <ToastCard key={item.id} item={item} />
            ))}
        </div>
      </div>
    </section>
  );
}
