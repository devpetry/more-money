"use client";

import { FormEvent, useEffect, useState } from "react";
import { CartaoSchema, TCartaoSchema } from "@/schemas/auth";
import { Button } from "./ui/button";
import { Dialog, DialogFooter } from "./ui/dialog";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { InlineAlert, LoadingState, Skeleton } from "./ui/feedback";
import { useFocoAposFalha } from "@/lib/foco";

interface ModalCartaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  cartaoId?: string | null;
}

type FormErrors = { [K in keyof TCartaoSchema]?: string };

export default function ModalCartao({
  isOpen,
  onClose,
  onSuccess,
  mode,
  cartaoId,
}: ModalCartaoProps) {
  const [nome, setNome] = useState("");
  const [diaFechamento, setDiaFechamento] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const envioRef = useFocoAposFalha<HTMLButtonElement>(salvando, erroEnvio !== null);

  useEffect(() => {
    if (mode === "edit" && isOpen && cartaoId) {
      setLoading(true);
      fetch(`/api/cartoes/${cartaoId}`)
        .then((res) => res.json())
        .then((data) => {
          setNome(data.nome || "");
          setDiaFechamento(String(data.dia_fechamento ?? ""));
          setDiaVencimento(String(data.dia_vencimento ?? ""));
        })
        .catch(() => setErroEnvio("Erro ao carregar cartão."))
        .finally(() => setLoading(false));
    } else if (!isOpen) {
      setNome("");
      setDiaFechamento("");
      setDiaVencimento("");
      setErrors({});
      setErroEnvio(null);
    }
  }, [isOpen, cartaoId, mode]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setErroEnvio(null);

    const validation = CartaoSchema.safeParse({
      nome,
      dia_fechamento: diaFechamento,
      dia_vencimento: diaVencimento,
    });
    if (!validation.success) {
      const errs: FormErrors = {};
      validation.error.issues.forEach((issue) => {
        errs[issue.path[0] as keyof FormErrors] = issue.message;
      });
      setErrors(errs);
      return;
    }

    setSalvando(true);

    try {
      const res = await fetch(
        mode === "create" ? "/api/cartoes" : `/api/cartoes/${cartaoId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: validation.data.nome,
            dia_fechamento: Number(validation.data.dia_fechamento),
            dia_vencimento: Number(validation.data.dia_vencimento),
          }),
        }
      );

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        setErroEnvio(errorData.error || res.statusText);
      }
    } catch {
      setErroEnvio("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      dismissible={!salvando}
      title={mode === "create" ? "Novo Cartão" : "Editar Cartão"}
      description="Os dias valem para as próximas faturas. Cada fatura pode ter as datas ajustadas depois."
    >
      {loading ? (
        <LoadingState label="Carregando dados do cartão...">
          <div className="space-y-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </LoadingState>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {erroEnvio && <InlineAlert tone="error">{erroEnvio}</InlineAlert>}

          <Field id="cartao-nome" label="Nome" error={errors.nome}>
            <Input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="cartao-fechamento"
              label="Dia de fechamento"
              error={errors.dia_fechamento}
              hint="Compras neste dia entram na próxima fatura."
            >
              <Input
                type="number"
                inputMode="numeric"
                value={diaFechamento}
                onChange={(e) => setDiaFechamento(e.target.value)}
              />
            </Field>

            <Field
              id="cartao-vencimento"
              label="Dia de vencimento"
              error={errors.dia_vencimento}
            >
              <Input
                type="number"
                inputMode="numeric"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
              />
            </Field>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </Button>

            <Button ref={envioRef} type="submit" size="lg" disabled={salvando}>
              {salvando
                ? "Salvando..."
                : mode === "create"
                  ? "Salvar"
                  : "Atualizar"}
            </Button>
          </DialogFooter>
        </form>
      )}
    </Dialog>
  );
}
