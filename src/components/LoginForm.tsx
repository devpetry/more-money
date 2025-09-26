"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { LoginSchema, TLoginSchema } from "@/schemas/auth";

type FormErrors = Partial<TLoginSchema>;

export default function LoginForm() {
  const searchParams = useSearchParams();
  const nextAuthError = searchParams.get("error");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);


  async function login(e: FormEvent<HTMLFormElement>) {
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
      const fieldErrors: Partial<FormErrors> = {};
      validation.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FormErrors;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Chama o signIn se bem-sucedido
    setLoading(true);
    signIn("credentials", {
      ...validation.data,
      callbackUrl: "/dashboard",
    });
    setLoading(false);
  }

  const getNextAuthErrorMessage = (error: string | null) => {
    if (error === "CredentialsSignin") {
      return "Credenciais inválidas. Verifique seu e-mail e senha.";
    }
    return null;
  };

  const authErrorMessage = getNextAuthErrorMessage(nextAuthError);

  return (
    <div className="w-full max-w-sm p-8 rounded-2xl bg-[#0D1117]">
      {/* LOGO */}
      <div className="flex justify-center mb-4 bg-[#9E9E9E]/15 rounded-xl">
        <div className="h-20 flex items-center justify-center text-3xl font-black text-[#E0E0E0]">
          *LOGO*
        </div>
      </div>

      {/* Título */}
      <h2 className="text-center text-[#E0E0E0] text-xl font-bold">
        Acesse sua conta
      </h2>
      <p className="text-center text-[#9E9E9E] text-sm mb-4">
        Preencha os campos abaixo para seguir
      </p>

      {/* Formulário */}
      <form onSubmit={login} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          placeholder="email@dominio.com"
          className={`px-4 py-2 bg-[#E0E0E0] text-[#0D1117] outline-none rounded-xl 
          ${
            errors.email
              ? "border-2 border-[#FF5252]"
              : "focus:ring-2 focus:ring-[#00C853]"
          }`}
        />
        {errors.email && (
          <p className="text-[#FF5252] text-xs -mt-3">{errors.email}</p>
        )}
        <input
          name="password"
          type="password"
          placeholder="senha"
          className={`px-4 py-2 bg-[#E0E0E0] text-[#0D1117] outline-none rounded-xl
          ${
            errors.password
              ? "border-2 border-[#FF5252]"
              : "focus:ring-2 focus:ring-[#00C853]"
          }`}
        />
        {errors.password && (
          <p className="text-[#FF5252] text-xs -mt-3">{errors.password}</p>
        )}
        <button
          type="submit"
          className="bg-[#00C853] hover:bg-[#00E676] text-[#0D1117] font-black py-2 transition rounded-xl"
        >
          {loading ? "ENTRANDO..." : "ENTRAR"}
        </button>
        {authErrorMessage && (
          <div className="text-[#FF5252] text-sm text-center">
            {authErrorMessage}
          </div>
        )}
      </form>
      <div className="mt-2 text-center">
        <a
          href="/recuperar-senha"
          className="text-sm text-[#9E9E9E] hover:underline"
        >
          Esqueci minha senha
        </a>
      </div>
    </div>
  );
}
