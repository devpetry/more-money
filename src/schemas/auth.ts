import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "O e-mail é obrigatório.")
    .email("Formato de e-mail inválido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export type TLoginSchema = z.infer<typeof LoginSchema>;

export const RecoverySchema = z.object({
  email: z
    .string()
    .min(1, "O e-mail é obrigatório para a recuperação.")
    .email("Formato de e-mail inválido."),
});

export type TRecoverySchema = z.infer<typeof RecoverySchema>;
