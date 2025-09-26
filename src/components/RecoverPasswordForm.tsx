"use client";

import { FormEvent, useState } from "react";
import { RecoverySchema, TRecoverySchema } from "@/schemas/auth";

type FormErrors = Partial<TRecoverySchema>;

export default function RecoverPasswordForm() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  async function recuperarSenha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);

    const data = {
      email: formData.get("email"),
    };

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

    // setLoading(true);
    // await signIn("credentials", {
    //   ...validation.data,
    //   callbackUrl: "/dashboard",
    // });
    // setLoading(false);
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

      {/* Formulário */}
      <form onSubmit={recuperarSenha} className="flex flex-col gap-4">
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
        <button
          type="submit"
          className="bg-[#00C853] hover:bg-[#00E676] text-[#0D1117] font-black py-2 transition rounded-xl"
        >
          {loading ? "ENVIANDO..." : "ENVIAR E-MAIL DE RECUPERAÇÃO"}
        </button>
      </form>
    </div>
  );
}
