"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PasswordChangeSchema, TPasswordChangeSchema } from "@/schemas/auth";
import { AuthCard } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { InlineAlert } from "@/components/ui/feedback";
import { useFocoAposFalha } from "@/lib/foco";

type FormErrors = Partial<TPasswordChangeSchema>;

interface ChangePasswordFormProps {
  token: string;
}

export default function ChangePasswordForm({ token }: ChangePasswordFormProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const envioRef = useFocoAposFalha<HTMLButtonElement>(
    loading,
    message !== null
  );

  async function alterarSenha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const validation = PasswordChangeSchema.safeParse(data);
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
      const response = await fetch("/api/auth/alterar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: validation.data.password }),
      });

      const result = await response.json();
      setMessage(result.message);
      setSuccess(result.success ?? null);

      if (result.success) {
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      setMessage("Não foi possível alterar sua senha. Tente novamente.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Redefinição de senha"
      description="Escolha uma nova senha para acessar sua conta"
      footer={
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <form onSubmit={alterarSenha} className="flex flex-col gap-4">
        {message && (
          <InlineAlert tone={success ? "success" : "error"}>{message}</InlineAlert>
        )}

        <Field id="nova-senha" label="Nova senha" error={errors.password}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            disabled={loading}
          />
        </Field>

        <Field
          id="confirmar-senha"
          label="Confirme a nova senha"
          error={errors.confirmPassword}
        >
          <PasswordInput
            name="confirmPassword"
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
          {loading ? "Alterando..." : "Alterar senha"}
        </Button>
      </form>
    </AuthCard>
  );
}
