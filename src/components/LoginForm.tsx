"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { LoginSchema, TLoginSchema } from "@/schemas/auth";

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

    // Validação com Zod
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
    <section className="w-full max-w-sm p-8 rounded-2xl bg-[#0D1117]">
      {/* logo */}
      <div className="flex justify-center mb-6 bg-[#9E9E9E]/15 rounded-xl">
        <div className="h-20 flex items-center justify-center text-3xl font-black text-[#E0E0E0]">
          *LOGO*
        </div>
      </div>

      {/* título */}
      <h2 className="text-center text-[#E0E0E0] text-xl font-bold">
        Acesse sua conta
      </h2>
      <p className="text-center text-[#9E9E9E] text-sm mb-6">
        Preencha os campos abaixo para seguir
      </p>

      {/* formulário */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <input
            name="email"
            type="email"
            placeholder="email@dominio.com"
            className={`w-full px-4 py-2 bg-[#E0E0E0] text-[#0D1117] outline-none rounded-xl ${
              errors.email
                ? "border-2 border-[#FF5252]"
                : "focus:ring-2 focus:ring-[#00C853]"
            }`}
          />
          {errors.email && (
            <p className="text-[#FF5252] text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <input
            name="password"
            type="password"
            placeholder="senha"
            className={`w-full px-4 py-2 bg-[#E0E0E0] text-[#0D1117] outline-none rounded-xl ${
              errors.password
                ? "border-2 border-[#FF5252]"
                : "focus:ring-2 focus:ring-[#00C853]"
            }`}
          />
          {errors.password && (
            <p className="text-[#FF5252] text-xs mt-1">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#00C853] hover:bg-[#00C853]/80 disabled:opacity-75 text-[#0D1117] font-black py-2 rounded-xl transition"
        >
          {loading ? "ENTRANDO..." : "ENTRAR"}
        </button>

        {authErrorMessage && (
          <p className="text-[#FF5252] text-sm text-center mt-2">
            {authErrorMessage}
          </p>
        )}
      </form>

      <div className="mt-4 text-center">
        <a
          href="/recuperar-senha"
          className="text-sm text-[#9E9E9E] hover:underline"
        >
          Esqueci minha senha
        </a>
      </div>
    </section>
  );
}
