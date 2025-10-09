import { NextResponse } from "next/server";
import { Resend } from "resend";
import { PasswordRecoverySchema } from "@/schemas/auth";
import { pool } from "@/lib/db";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();

  // Validação com Zod
  const validation = PasswordRecoverySchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, message: "E-mail inválido." },
      { status: 400 }
    );
  }

  const { email } = validation.data;
  const client = await pool.connect();

  try {
    // Verifica se o e-mail pertence a um usuário existente
    const res = await client.query(
      'SELECT id, nome FROM "Usuario" WHERE email = $1',
      [email]
    );
    const usuario = res.rows[0];

    if (!usuario) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Se o e-mail estiver registrado, enviaremos as instruções de recuperação.",
        },
        { status: 200 }
      );
    }

    // Gera token único e cria seu hash para armazenar no banco
    const recoveryToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(recoveryToken)
      .digest("hex");

    // Token expira em 1 hora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Atualiza o usuário com o token e data de expiração
    await client.query(
      `UPDATE "Usuario" SET 
        "token_recuperacao" = $1, 
        "expiracao_token_recuperacao" = $2 
      WHERE id = $3`,
      [hashedToken, expiresAt, usuario.id]
    );

    // Monta o link de recuperação
    const recoveryLink = `${process.env.NEXTAUTH_URL}/alterar-senha?token=${recoveryToken}`;

    // Envia o e-mail com o link
    const { error } = await resend.emails.send({
      from: "More Money <onboarding@resend.dev>",
      to: [email],
      subject: "Recuperação de Senha",
      html: `
        <p>Olá ${usuario.nome},</p>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p><a href="${recoveryLink}" target="_blank">Clique aqui</a> para criar uma nova senha (link válido por 1 hora).</p>
        <p>Se não foi você, ignore este e-mail.</p>
      `,
    });

    if (error && process.env.NODE_ENV === "development") {
      console.error("Erro ao enviar e-mail:", error);
    }

    // Retorna resposta genérica de sucesso (independente de o e-mail existir)
    return NextResponse.json(
      {
        success: true,
        message: "Instruções de recuperação enviadas para o e-mail informado.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro na recuperação de senha:", err);
    return NextResponse.json(
      { success: false, message: "Erro interno. Tente novamente." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
