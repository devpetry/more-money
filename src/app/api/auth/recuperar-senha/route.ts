import { NextResponse } from "next/server";
import { Resend } from "resend";
import { RecoverySchema } from "@/schemas/auth";
import { Pool } from "pg";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

// Pool de conexões
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export async function POST(request: Request) {
  const body = await request.json();

  // Validação com Zod
  const validation = RecoverySchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, message: "E-mail inválido." },
      { status: 400 }
    );
  }

  const { email } = validation.data;
  const client = await pool.connect();

  try {
    // Verificar se o usuário existe
    const res = await client.query(
      'SELECT id, nome FROM "Usuario" WHERE email = $1',
      [email]
    );
    const usuario = res.rows[0];

    // Retornar sucesso mesmo que o e-mail não exista
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

    // Gerar token de recuperação e salvar hash
    const recoveryToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(recoveryToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await client.query(
      `UPDATE "Usuario" SET 
        "token_recuperacao" = $1, 
        "expiracao_token_recuperacao" = $2 
      WHERE id = $3`,
      [hashedToken, expiresAt, usuario.id]
    );

    // Link de recuperação
    const recoveryLink = `${process.env.NEXTAUTH_URL}/alterar-senha?token=${recoveryToken}`;

    // Enviar e-mail
    const { error } = await resend.emails.send({
      from: "More Money <onboarding@resend.dev>", // deve ser domínio verificado
      to: [email],
      subject: "Recuperação de Senha",
      html: `
        <p>Olá ${usuario.nome},</p>
        <p>Recebemos uma solicitação para redefinir a sua senha.</p>
        <p>Clique no link abaixo para criar uma nova senha. O link expira em 1 hora.</p>
        <a href="${recoveryLink}">Redefinir Senha</a>
        <p>Se você não solicitou essa redefinição, pode ignorar este e-mail.</p>
      `,
    });

    if (error) {
      console.error("Erro ao enviar e-mail:", error);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Instruções de recuperação enviadas para o e-mail.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro na recuperação de senha:", err);
    return NextResponse.json(
      { success: false, message: "Ocorreu um erro interno. Tente novamente." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
