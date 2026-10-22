"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  PasswordRecoverySchema,
  TPasswordRecoverySchema,
} from "@/schemas/auth";
import { AuthCard } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/ui/feedback";
import { useFocoAposFalha } from "@/lib/foco";

type FormErrors = Partial<TPasswordRecoverySchema>;

export default function RecoverPasswordForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const envioRef = useFocoAposFalha<HTMLButtonElement>(
    loading,
    message !== null
  );

  async function recuperarSenha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const data = { email: formData.get("email") };

    const validation = PasswordRecoverySchema.safeParse(data);
    if (!validation.success) {
      const fieldErrors: Partial<FormErrors> = {};
      validation.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormErrors;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const result = await response.json();
      setMessage(result.message);
      setSuccess(result.success ?? null);

      if (result.success) {
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      setMessage(
        "Não foi possível processar sua solicitação. Tente novamente."
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Recuperação de senha"
      description="Insira seu e-mail para recuperar sua senha"
      footer={
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <form onSubmit={recuperarSenha} className="flex flex-col gap-4">
        {message && (
          <InlineAlert tone={success ? "success" : "error"}>{message}</InlineAlert>
        )}

        <Field id="recuperar-email" label="E-mail" error={errors.email}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="email@dominio.com"
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
          {loading ? "Enviando..." : "Enviar e-mail de recuperação"}
        </Button>
      </form>
    </AuthCard>
  );
}
