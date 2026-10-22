"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Sincroniza um <dialog> nativo com o estado do React. O showModal() da
 * plataforma já prende o foco, torna o restante da página inerte e fecha com
 * Esc; aqui só repassamos o fechamento ao estado e devolvemos o foco.
 */
export function useNativeDialog(
  ref: React.RefObject<HTMLDialogElement | null>,
  open: boolean,
  onClose: () => void,
  dismissible = true
) {
  const openRef = React.useRef(open);
  const onCloseRef = React.useRef(onClose);
  const dismissibleRef = React.useRef(dismissible);
  openRef.current = open;
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    return () => {
      if (dialog.open) dialog.close();
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [ref, open]);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // Esc: o React decide se fecha (ex.: bloqueado enquanto salva)
    const handleCancel = (event: Event) => {
      event.preventDefault();
      if (dismissibleRef.current) onCloseRef.current();
    };
    // Fechamento forçado pelo navegador: mantém o estado coerente. O evento
    // é assíncrono; se o diálogo já foi reaberto (ex.: remontagem do
    // StrictMode), o close era de uma limpeza anterior e é ignorado.
    const handleClose = () => {
      if (openRef.current && !dialog.open) onCloseRef.current();
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
    };
  }, [ref]);
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  // false impede Esc/botão fechar (ex.: durante o envio)
  dismissible?: boolean;
  role?: "dialog" | "alertdialog";
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  dismissible = true,
  role = "dialog",
  className,
}: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  useNativeDialog(ref, open, onClose, dismissible);

  return (
    <dialog
      ref={ref}
      role={role === "alertdialog" ? "alertdialog" : undefined}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm open:animate-in open:fade-in-0 open:zoom-in-95",
        className
      )}
    >
      {open && (
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2
                id={titleId}
                className="font-display text-lg font-semibold tracking-tight"
              >
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={!dismissible}
              aria-label="Fechar"
              className="touch-target -mr-1.5 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

// Rodapé padrão: ações empilhadas no mobile, alinhadas à direita no desktop
export function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto",
        className
      )}
      {...props}
    />
  );
}
