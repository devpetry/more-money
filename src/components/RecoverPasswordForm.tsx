"use client";

import { FormEvent, useState } from "react";
import { RecoverySchema, TRecoverySchema } from "@/schemas/auth";

type FormErrors = Partial<TRecoverySchema>;

export default function RecoverPasswordForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);

  async function recuperarSenha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const data = { email: formData.get("email") };

    // Validação com Zod
    const validation = RecoverySchema.safeParse(data);
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
    <div className="w-full max-w-sm p-8 rounded-2xl bg-[#0D1117]">
      {/* LOGO */}
      <div className="flex justify-center mb-4 bg-[#9E9E9E]/15 rounded-xl">
        <div className="h-20 flex items-center justify-center text-3xl font-black text-[#E0E0E0]">
          *LOGO*
        </div>
      </div>

      {/* Título */}
      <h2 className="text-center text-[#E0E0E0] text-xl font-bold">
        Recuperação de senha
      </h2>
      <p className="text-center text-[#9E9E9E] text-sm mb-4">
        Insira seu e-mail para recuperar sua senha
      </p>

      {/* Mensagem de feedback */}
      {message && (
        <p
          className={`text-center text-sm mb-4 ${
            success ? "text-[#00C853]" : "text-[#FF5252]"
          }`}
        >
          {message}
        </p>
      )}

      {/* Formulário */}
      <form onSubmit={recuperarSenha} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          placeholder="email@dominio.com"
          disabled={loading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={`px-4 py-2 bg-[#E0E0E0] text-[#0D1117] outline-none rounded-xl
            ${
              errors.email
                ? "border-2 border-[#FF5252]"
                : "focus:ring-2 focus:ring-[#00C853]"
            }`}
        />
        {errors.email && (
          <p id="email-error" className="text-[#FF5252] text-xs -mt-3">
            {errors.email}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-[#00C853] hover:bg-[#00C853]/75 text-[#0D1117] font-black py-2 transition rounded-xl disabled:opacity-50"
        >
          {loading ? "ENVIANDO..." : "ENVIAR E-MAIL DE RECUPERAÇÃO"}
        </button>
      </form>
    </div>
  );
}
