"use client";

import { FormEvent, useState } from "react";
import { PasswordChangeSchema, TPasswordChangeSchema } from "@/schemas/auth";
import { Eye, EyeOff } from "lucide-react";

type FormErrors = Partial<TPasswordChangeSchema>;

interface ChangePasswordFormProps {
  token: string;
}

export default function ChangePasswordForm({ token }: ChangePasswordFormProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="w-full max-w-sm p-8 rounded-2xl bg-[#0D1117]">
      <div className="flex justify-center mb-4 bg-[#9E9E9E]/15 rounded-xl">
        <div className="h-20 flex items-center justify-center text-3xl font-black text-[#E0E0E0]">
          *LOGO*
        </div>
      </div>

      <h2 className="text-center text-[#E0E0E0] text-xl font-bold">
        Redefinição de senha
      </h2>
      <p className="text-center text-[#9E9E9E] text-sm mb-4">
        Escolha uma nova senha para acessar sua conta
      </p>

      {message && (
        <p
          aria-live="polite"
          className={`text-center text-sm mb-4 ${
            success ? "text-[#00C853]" : "text-[#FF5252]"
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={alterarSenha} className="flex flex-col gap-4">
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="nova senha"
            disabled={loading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={`w-full px-4 py-2 pr-10 bg-[#E0E0E0] text-[#0D1117] outline-none rounded-xl ${
              errors.password
                ? "border-2 border-[#FF5252]"
                : "focus:ring-2 focus:ring-[#00C853]"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0D1117]/70 hover:text-[#0D1117]"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          {errors.password && (
            <p id="password-error" className="text-[#FF5252] text-xs -mt-3">
              {errors.password}
            </p>
          )}
        </div>
        <div className="relative">
          <input
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="confirme a nova senha"
            disabled={loading}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            className={`w-full px-4 py-2 pr-10 bg-[#E0E0E0] text-[#0D1117] outline-none rounded-xl ${
              errors.confirmPassword
                ? "border-2 border-[#FF5252]"
                : "focus:ring-2 focus:ring-[#00C853]"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0D1117]/70 hover:text-[#0D1117]"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          {errors.confirmPassword && (
            <p
              id="confirmPassword-error"
              className="text-[#FF5252] text-xs -mt-3"
            >
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#00C853] hover:bg-[#00C853]/75 text-[#0D1117] font-black py-2 transition rounded-xl disabled:opacity-50"
        >
          {loading ? "ALTERANDO..." : "ALTERAR SENHA"}
        </button>
      </form>
    </div>
  );
}
