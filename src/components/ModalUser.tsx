"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import {
  UsuarioSchema,
  UsuarioEditSchema,
  TUsuarioSchema,
  TUsuarioEditSchema,
} from "@/schemas/auth";
import { Button } from "./ui/button";
import { Dialog, DialogFooter } from "./ui/dialog";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { NativeSelect } from "./ui/select";
import { InlineAlert, LoadingState, Skeleton } from "./ui/feedback";
import { useFocoAposFalha } from "@/lib/foco";

interface ModalUserProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  userId: number | null;
}

type FormErrors = Partial<Record<string, string>>;

const TIPOS_USUARIO = [
  { id: 1, nome: "ADMIN" },
  { id: 3, nome: "COLABORADOR" },
];

const getTipoIdByNome = (nome?: string | null): string => {
  if (!nome) return "";
  const tipo = TIPOS_USUARIO.find((t) => t.nome === nome.toUpperCase());
  return tipo ? String(tipo.id) : "";
};

export default function ModalUser({
  isOpen,
  onClose,
  onSuccess,
  mode,
  userId,
}: ModalUserProps) {
  const isEdit = mode === "edit";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<string>("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const envioRef = useFocoAposFalha<HTMLButtonElement>(salvando, erroEnvio !== null);

  const carregarUsuario = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/usuarios/${userId}`);
      if (!res.ok) {
        setErroEnvio("Falha ao carregar usuário.");
        return;
      }
      const data = await res.json();
      setNome(data.nome || "");
      setEmail(data.email || "");
      setTipoUsuario(getTipoIdByNome(data.tipo_usuario ?? null));
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      setErroEnvio("Erro ao carregar usuário.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && isEdit) {
      carregarUsuario();
    }
  }, [isOpen, isEdit, carregarUsuario]);

  useEffect(() => {
    if (!isOpen) {
      setNome("");
      setEmail("");
      setSenha("");
      setTipoUsuario("");
      setErrors({});
      setErroEnvio(null);
      setLoading(false);
      setSalvando(false);
    }
  }, [isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setErroEnvio(null);

    const dataToSend = {
      nome,
      email,
      tipo_usuario: tipoUsuario,
      ...(isEdit ? {} : { senha }),
    } as unknown as TUsuarioSchema & Partial<TUsuarioEditSchema>;

    if (!isEdit) {
      dataToSend.senha = senha;
    }

    const schema = isEdit ? UsuarioEditSchema : UsuarioSchema;
    const validation = schema.safeParse(dataToSend);

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof (TUsuarioSchema &
          TUsuarioEditSchema);
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSalvando(true);

    try {
      const url = isEdit
        ? `/api/auth/usuarios/${userId}`
        : "/api/auth/usuarios";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? JSON.stringify(dataToSend)
        : JSON.stringify({ data: dataToSend });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setErroEnvio(errorData.error || "Erro ao salvar usuário");
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
      setErroEnvio("Erro de conexão ao salvar usuário.");
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
      title={isEdit ? "Editar Usuário" : "Novo Usuário"}
    >
      {loading ? (
        <LoadingState label="Carregando dados...">
          <div className="space-y-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </LoadingState>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {erroEnvio && <InlineAlert tone="error">{erroEnvio}</InlineAlert>}

          <Field id="usuario-nome" label="Nome" error={errors.nome}>
            <Input
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </Field>

          <Field id="usuario-email" label="E-mail" error={errors.email}>
            <Input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          {!isEdit && (
            <Field
              id="usuario-senha"
              label="Senha"
              error={errors.senha}
              hint="* Recomendamos que o novo usuário altere a senha no primeiro login"
            >
              <Input
                name="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </Field>
          )}

          <Field
            id="usuario-tipo"
            label="Tipo de Usuário"
            error={errors.tipo_usuario}
          >
            <NativeSelect
              name="tipo_usuario"
              value={tipoUsuario}
              onChange={(e) => setTipoUsuario(e.target.value)}
            >
              <option value="" disabled>
                Selecione o tipo de usuário
              </option>
              {TIPOS_USUARIO.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.nome}
                </option>
              ))}
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
