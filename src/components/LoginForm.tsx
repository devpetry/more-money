"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

// Define o Schema de validação para o login
const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "O e-mail é obrigatório.")
    .email("Formato de e-mail inválido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

type FormErrors = z.infer<typeof LoginSchema> & { general?: string };

export default function LoginForm() {
  const searchParams = useSearchParams();
  const nextAuthError = searchParams.get("error");
  
  const [errors, setErrors] = useState<Partial<FormErrors>>({});

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
    signIn("credentials", {
      ...validation.data, // Usa os dados validados pelo Zod
      callbackUrl: "/dashboard",
    });
  }

  const getNextAuthErrorMessage = (error: string | null) => {
    if (error === "CredentialsSignin") {
      return "Credenciais inválidas. Verifique seu e-mail e senha.";
    }
    return null;
  };

  const authErrorMessage = getNextAuthErrorMessage(nextAuthError);

  return (
    <>
      <form onSubmit={login} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          placeholder="email@dominio.com"
          className={`px-4 py-2 rounded-md bg-[#E0E0E0] text-[#0D1117] outline-none rounded-xl 
            ${errors.email ? "border-2 border-[#FF5252]" : "focus:ring-2 focus:ring-[#00C853]"}`}
        />
        {errors.email && (
          <p className="text-[#FF5252] text-xs -mt-3">{errors.email}</p>
        )}
        <input
          name="password"
          type="password"
          placeholder="senha"
          className={`px-4 py-2 rounded-md bg-[#E0E0E0] text-[#0D1117] outline-none rounded-xl
            ${errors.password ? "border-2 border-[#FF5252]" : "focus:ring-2 focus:ring-[#00C853]"}`}
        />
        {errors.password && (
          <p className="text-[#FF5252] text-xs -mt-3">{errors.password}</p>
        )}
        <button
          type="submit"
          className="bg-[#00C853] hover:bg-[#00E676] text-[#0D1117] font-black py-2 transition rounded-xl mt-2"
        >
          ENTRAR
        </button>
        {authErrorMessage && (
          <div className="text-[#FF5252] text-sm text-center">
            {authErrorMessage}
          </div>
        )}
      </form>
      <div className="mt-4 text-center">
        <a href="#" className="text-sm text-[#9E9E9E] hover:underline">
          Esqueci minha senha
        </a>
      </div>
    </>
  );
}