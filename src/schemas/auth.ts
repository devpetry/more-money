import { z } from "zod";

/* ----------------------------- LOGIN ----------------------------- */
export const LoginSchema = z.object({
  email: z
    .string()
    .nonempty("O e-mail é obrigatório.")
    .trim()
    .email("Digite um e-mail válido."),
  password: z
    .string()
    .nonempty("A senha é obrigatória.")
    .min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export type TLoginSchema = z.infer<typeof LoginSchema>;

/* ------------------------- RECUPERAÇÃO ---------------------------- */
export const PasswordRecoverySchema = z.object({
  email: z
    .string()
    .nonempty("O e-mail é obrigatório.")
    .trim()
    .email("Digite um e-mail válido."),
});

export type TPasswordRecoverySchema = z.infer<typeof PasswordRecoverySchema>;

/* ---------------------- REDEFINIÇÃO DE SENHA ---------------------- */
export const PasswordChangeSchema = z
  .object({
    password: z
      .string()
      .nonempty("A nova senha é obrigatória.")
      .min(6, "A nova senha deve ter pelo menos 6 caracteres.")
      .max(100, "A senha não pode ultrapassar 100 caracteres."),
    confirmPassword: z
      .string()
      .nonempty("Confirme sua nova senha.")
      .min(6, "A confirmação deve ter pelo menos 6 caracteres."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

export type TPasswordChangeSchema = z.infer<typeof PasswordChangeSchema>;

/* -------------------------- EXPORTS ÚNICOS ------------------------ */
export const Schemas = {
  login: LoginSchema,
  recovery: PasswordRecoverySchema,
  passwordChange: PasswordChangeSchema,
};

export type {
  TLoginSchema as LoginData,
  TPasswordRecoverySchema as RecoveryData,
  TPasswordChangeSchema as PasswordChangeData,
};
