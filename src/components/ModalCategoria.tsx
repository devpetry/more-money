"use client";

import { FormEvent, useEffect, useState } from "react";
import { CategoriaSchema, TCategoriaSchema } from "@/schemas/auth";
import { Button } from "./ui/button";
import { Dialog, DialogFooter } from "./ui/dialog";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { NativeSelect } from "./ui/select";
import { InlineAlert, LoadingState, Skeleton } from "./ui/feedback";
import { useFocoAposFalha } from "@/lib/foco";

type FormErrors = { [K in keyof TCategoriaSchema]?: string };

interface ModalCategoriaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  categoriaId?: number | null;
}

export default function ModalCategoria({
  isOpen,
  onClose,
  onSuccess,
  mode,
  categoriaId,
}: ModalCategoriaProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"receita" | "despesa" | "">("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const envioRef = useFocoAposFalha<HTMLButtonElement>(salvando, erroEnvio !== null);

  // Carrega dados se for edição
  useEffect(() => {
    if (mode === "edit" && isOpen && categoriaId) {
      setLoading(true);
      fetch(`/api/categorias/${categoriaId}`)
        .then((res) => res.json())
        .then((data) => {
          setNome(data.nome || "");
          setTipo(data.tipo || "");
        })
        .catch(() => setErroEnvio("Erro ao carregar categoria."))
        .finally(() => setLoading(false));
    } else if (!isOpen) {
      setNome("");
      setTipo("");
      setErrors({});
      setErroEnvio(null);
    }
  }, [isOpen, categoriaId, mode]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setErroEnvio(null);

    const data = { nome, tipo };
    const validation = CategoriaSchema.safeParse(data);
    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as keyof FormErrors] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSalvando(true);

    try {
      const res = await fetch(
        mode === "create"
          ? "/api/categorias"
          : `/api/categorias/${categoriaId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        setErroEnvio(`Erro: ${errorData.error || res.statusText}`);
      }
    } catch {
      setErroEnvio("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      dismissible={!salvando}
      title={mode === "create" ? "Nova Categoria" : "Editar Categoria"}
    >
      {loading ? (
        <LoadingState label="Carregando dados da categoria...">
          <div className="space-y-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </LoadingState>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {erroEnvio && <InlineAlert tone="error">{erroEnvio}</InlineAlert>}

          <Field id="categoria-nome" label="Nome" error={errors.nome}>
            <Input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </Field>

          <Field id="categoria-tipo" label="Tipo" error={errors.tipo}>
            <NativeSelect
              value={tipo}
              onChange={(e) =>
                setTipo(e.target.value as "receita" | "despesa" | "")
              }
            >
              <option value="" disabled>
                Selecione o tipo de categoria
              </option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </NativeSelect>
          </Field>

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
