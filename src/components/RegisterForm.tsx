"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { CadastroSchema, TCadastroSchema } from "@/schemas/auth";
import { AuthCard } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { InlineAlert } from "@/components/ui/feedback";
import { useFocoAposFalha } from "@/lib/foco";

type FormErrors = Partial<TCadastroSchema>;

export default function RegisterForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contaCriada, setContaCriada] = useState(false);
  const envioRef = useFocoAposFalha<HTMLButtonElement>(
    loading,
    erroEnvio !== null
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setErroEnvio(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      email: formData.get("email"),
      senha: formData.get("senha"),
    };

    const validation = CadastroSchema.safeParse(data);

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    let res: Response;
    try {
      res = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
    } catch {
      setErroEnvio("Erro de conexão. Tente novamente.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      setErroEnvio(errorData.error || "Não foi possível criar a conta.");
      setLoading(false);
      return;
    }

    // Conta criada: uma falha daqui em diante não pode sugerir o contrário.
    try {
      // Mantém o botão desabilitado: o signIn redireciona para o dashboard.
      await signIn("credentials", {
        email: validation.data.email,
        password: validation.data.senha,
        callbackUrl: "/dashboard",
      });
    } catch {
      setContaCriada(true);
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Crie sua conta"
      description="Preencha os campos abaixo para começar"
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      {contaCriada ? (
        <div className="flex flex-col gap-4">
          <InlineAlert tone="success">
            Conta criada com sucesso, mas não foi possível entrar
            automaticamente. Entre com seu e-mail e senha.
          </InlineAlert>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Ir para o login</Link>
          </Button>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {erroEnvio && <InlineAlert tone="error">{erroEnvio}</InlineAlert>}

        <Field id="cadastro-nome" label="Nome" error={errors.nome}>
          <Input name="nome" autoComplete="name" disabled={loading} />
        </Field>

        <Field id="cadastro-email" label="E-mail" error={errors.email}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="email@dominio.com"
            disabled={loading}
          />
        </Field>

        <Field id="cadastro-senha" label="Senha" error={errors.senha}>
          <PasswordInput
            name="senha"
            autoComplete="new-password"
            disabled={loading}
          />
        </Field>

        <Button
          ref={envioRef}
          type="submit"
          size="lg"
          disabled={loading}
          className="mt-2 w-full"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
      )}
    </AuthCard>
  );
}
