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
// O bcrypt só considera os primeiros 72 bytes (UTF-8) da senha; acima disso
// ela seria truncada em silêncio. Vale para cadastro e redefinição.
const senhaAte72Bytes = (senha: string) =>
  new TextEncoder().encode(senha).length <= 72;
const MSG_SENHA_BYTES =
  "A senha deve ter no máximo 72 bytes (acentos e emojis ocupam mais de 1).";

export const NovaSenhaSchema = z
  .string()
  .nonempty("A nova senha é obrigatória.")
  .min(6, "A nova senha deve ter pelo menos 6 caracteres.")
  .refine(senhaAte72Bytes, MSG_SENHA_BYTES);

export const PasswordChangeSchema = z
  .object({
    password: NovaSenhaSchema,
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
  tipo_usuario: z.enum(["1", "3"], {
    message: "Selecione um tipo de usuário válido.",
  }),
});

export type TUsuarioSchema = z.infer<typeof UsuarioSchema>;

/* ---------------------------- CADASTRO PÚBLICO ---------------------------- */
// Só nome, e-mail e senha: o perfil nunca vem do cliente. Os limites valem
// apenas aqui.
export const CadastroSchema = UsuarioSchema.pick({
  nome: true,
  email: true,
  senha: true,
}).extend({
  nome: UsuarioSchema.shape.nome.max(
    100,
    "O nome deve ter no máximo 100 caracteres."
  ),
  email: UsuarioSchema.shape.email.max(
    254,
    "O e-mail deve ter no máximo 254 caracteres."
  ),
  senha: UsuarioSchema.shape.senha.refine(senhaAte72Bytes, MSG_SENHA_BYTES),
});

export type TCadastroSchema = z.infer<typeof CadastroSchema>;

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
  tipo_usuario: z.enum(["1", "3"], {
    message: "Selecione um tipo de usuário válido.",
  }),
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
export const LancamentoSchema = z
  .object({
    descricao: z.string().min(1, "A descrição é obrigatória."),
    valor: z.number().positive("O valor deve ser maior que zero."),
    tipo: z
      .enum(["receita", "despesa"])
      .refine((val) => ["receita", "despesa"].includes(val), {
        message: "Tipo inválido.",
      }),
    data: z.string().min(1, "A data é obrigatória."),
    categoria_id: z.preprocess(
      (val) => (val === null || val === undefined ? "" : val),
      z.string().min(1, "A categoria é obrigatória.")
    ),
    // Despesa: carteira OU cartão. Receita: sempre carteira.
    carteira_id: z.string().nullable().optional(),
    cartao_id: z.string().nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.cartao_id) {
      if (v.tipo !== "despesa") {
        ctx.addIssue({
          code: "custom",
          path: ["cartao_id"],
          message: "Receitas não podem ser lançadas em cartão.",
        });
      }
    } else if (!v.carteira_id) {
      ctx.addIssue({
        code: "custom",
        path: ["carteira_id"],
        message: "A carteira é obrigatória.",
      });
    }
  });

export type TLancamentoSchema = z.infer<typeof LancamentoSchema>;

/* ------------------------------ CARTÃO ----------------------------- */
// Dias chegam como texto do <input>: "" é obrigatório; decimal, 0 e 32 são inválidos
const diaDoMes = (rotulo: string) =>
  z
    .string()
    .trim()
    .min(1, `O dia de ${rotulo} é obrigatório.`)
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 31),
      `O dia de ${rotulo} deve ser um número inteiro de 1 a 31.`
    );

export const CartaoSchema = z.object({
  nome: z.string().trim().min(1, "O nome é obrigatório."),
  dia_fechamento: diaDoMes("fechamento"),
  dia_vencimento: diaDoMes("vencimento"),
});

export type TCartaoSchema = z.infer<typeof CartaoSchema>;

/* --------------------------- FATURA (cartão) ------------------------ */
export const PagamentoFaturaSchema = z.object({
  valor: z
    .number({ error: "O valor é obrigatório." })
    .positive("O valor deve ser maior que zero."),
  data: z.string().min(1, "A data efetiva do pagamento é obrigatória."),
  carteira_id: z.string().min(1, "A carteira é obrigatória."),
});

export type TPagamentoFaturaSchema = z.infer<typeof PagamentoFaturaSchema>;

export const AjusteDatasFaturaSchema = z.object({
  data_fechamento: z.string().min(1, "A data de fechamento é obrigatória."),
  data_vencimento: z.string().min(1, "A data de vencimento é obrigatória."),
});

export type TAjusteDatasFaturaSchema = z.infer<typeof AjusteDatasFaturaSchema>;

/* -------------------------- EXPORTS ÚNICOS ------------------------ */
export const Schemas = {
  login: LoginSchema,
  recovery: PasswordRecoverySchema,
  passwordChange: PasswordChangeSchema,
  usuario: UsuarioSchema,
  cadastro: CadastroSchema,
  usuarioEdit: UsuarioEditSchema,
  categora: CategoriaSchema,
  lancamento: LancamentoSchema,
  cartao: CartaoSchema,
};

export type {
  TLoginSchema as LoginData,
  TPasswordRecoverySchema as RecoveryData,
  TPasswordChangeSchema as PasswordChangeData,
  TUsuarioSchema as UsuarioData,
  TUsuarioEditSchema as UsuarioEditData,
  TCategoriaSchema as CategoriaData,
  TLancamentoSchema as LancamentoData,
  TCartaoSchema as CartaoData,
};
