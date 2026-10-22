"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { LoginSchema, TLoginSchema } from "@/schemas/auth";
import { AuthCard } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { InlineAlert } from "@/components/ui/feedback";

type FormErrors = Partial<TLoginSchema>;

export default function LoginForm() {
  const searchParams = useSearchParams();
  const nextAuthError = searchParams.get("error");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const validation = LoginSchema.safeParse(data);

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
    try {
      await signIn("credentials", {
        ...validation.data,
        callbackUrl: "/dashboard",
      });
    } finally {
      setLoading(false);
    }
  }

  function getNextAuthErrorMessage(error: string | null) {
    switch (error) {
      case "CredentialsSignin":
        return "Credenciais inválidas. Verifique seu e-mail e senha.";
      default:
        return null;
    }
  }

  const authErrorMessage = getNextAuthErrorMessage(nextAuthError);

  return (
    <AuthCard
      title="Acesse sua conta"
      description="Preencha os campos abaixo para seguir"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {authErrorMessage && (
          <InlineAlert tone="error">{authErrorMessage}</InlineAlert>
        )}

        <Field id="login-email" label="E-mail" error={errors.email}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="email@dominio.com"
          />
        </Field>

        <Field id="login-senha" label="Senha" error={errors.password}>
          <PasswordInput name="password" autoComplete="current-password" />
        </Field>

        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-5 text-center">
        <Link
          href="/recuperar-senha"
          className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>
    </AuthCard>
  );
}
