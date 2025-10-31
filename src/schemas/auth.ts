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

/* --------------------------- EMPRESA --------------------------- */
export const EmpresaSchema = z.object({
  nome: z
    .string()
    .nonempty("O nome da empresa é obrigatório.")
    .trim()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(100, "O nome é muito longo."),
  cnpj: z
    .string()
    .nonempty("O CNPJ é obrigatório.")
    .min(18, "O CNPJ deve ter pelo menos 14 caracteres."),
});

export type TEmpresaSchema = z.infer<typeof EmpresaSchema>;

/* ---------------------------- USUÁRIO ---------------------------- */
export const UsuarioSchema = z.object({
  nome: z
    .string()
    .nonempty("O nome é obrigatório.")
    .trim()
    .min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z
    .string()
    .nonempty("O e-mail é obrigatório.")
    .trim()
    .email("Digite um e-mail válido."),
  senha: z
    .string()
    .nonempty("A senha é obrigatória.")
    .min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export type TUsuarioSchema = z.infer<typeof UsuarioSchema>;

/* ---------------------------- EDIÇÃO DE USUÁRIO ---------------------------- */
export const UsuarioEditSchema = z.object({
  nome: z
    .string()
    .nonempty("O nome é obrigatório.")
    .trim()
    .min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z
    .string()
    .nonempty("O e-mail é obrigatório.")
    .trim()
    .email("Digite um e-mail válido."),
});

export type TUsuarioEditSchema = z.infer<typeof UsuarioEditSchema>;

/* ---------------------------- CATEGORIA ---------------------------- */
export const CategoriaSchema = z.object({
  nome: z.string().min(2, "O nome é obrigatório."),
  tipo: z.string().refine((val) => val === "receita" || val === "despesa", {
    message: "Selecione o tipo da categoria.",
  }),
});

export type TCategoriaSchema = z.infer<typeof CategoriaSchema>;

/* ---------------------------- LANÇAMENTO ---------------------------- */
export const LancamentoSchema = z.object({
  descricao: z.string().min(1, "A descrição é obrigatória."),
  valor: z.number().positive("O valor deve ser maior que zero."),
  tipo: z
    .enum(["receita", "despesa"])
    .refine((val) => ["receita", "despesa"].includes(val), {
      message: "Tipo inválido.",
    }),
  data: z.string().min(1, "A data é obrigatória."),
  categoria_id: z.string().optional(),
});

export type TLancamentoSchema = z.infer<typeof LancamentoSchema>;

/* -------------------------- EXPORTS ÚNICOS ------------------------ */
export const Schemas = {
  login: LoginSchema,
  recovery: PasswordRecoverySchema,
  passwordChange: PasswordChangeSchema,
  empresa: EmpresaSchema,
  usuario: UsuarioSchema,
  usuarioEdit: UsuarioEditSchema,
  categora: CategoriaSchema,
  lancamento: LancamentoSchema,
};

export type {
  TLoginSchema as LoginData,
  TPasswordRecoverySchema as RecoveryData,
  TPasswordChangeSchema as PasswordChangeData,
  TEmpresaSchema as EmpresaData,
  TUsuarioSchema as UsuarioData,
  TUsuarioEditSchema as UsuarioEditData,
  TCategoriaSchema as CategoriaData,
  TLancamentoSchema as LancamentoData,
};
