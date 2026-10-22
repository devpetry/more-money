"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

// Substitui window.confirm() por um diálogo acessível com a mesma semântica
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm deve ser usado dentro de ConfirmProvider");
  return confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    resolveRef.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function settle(value: boolean) {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <Dialog
          open
          role="alertdialog"
          onClose={() => settle(false)}
          title={options.title}
          description={options.description}
          className="max-w-sm"
        >
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              size="lg"
              data-autofocus
              onClick={() => settle(false)}
            >
              {options.cancelLabel ?? "Cancelar"}
            </Button>
            <Button
              variant={options.destructive ? "destructive" : "default"}
              size="lg"
              onClick={() => settle(true)}
            >
              {options.confirmLabel ?? "Confirmar"}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </ConfirmContext.Provider>
  );
}
