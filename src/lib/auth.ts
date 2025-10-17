import { NextAuthOptions, DefaultUser, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

export type TipoUsuario = "ADMIN" | "GERENTE" | "COLABORADOR";

export interface ExtendedUser extends DefaultUser {
  id: string;
  tipo_usuario: TipoUsuario;
  empresa_id: number | null;
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: ExtendedUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tipo_usuario: TipoUsuario;
    empresa_id: number | null;
  }
}

async function findUserByEmail(email: string) {
  const res = await query(
    `SELECT id, nome, email, "senha_hash", "tipo_usuario", "empresa_id"
     FROM "Usuarios"
     WHERE email = $1`,
    [email]
  );

  const usuario = res[0];

  return usuario;
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },

      async authorize(credentials): Promise<ExtendedUser | null> {
        if (!credentials) return null;

        try {
          const usuario = await findUserByEmail(credentials.email);

          if (!usuario) {
            console.error(
              "[AUTH ERROR] Usuário não encontrado:",
              credentials.email
            );
            return null;
          }

          const senhaValida = await bcrypt.compare(
            credentials.password,
            usuario.senha_hash
          );

          if (!senhaValida) {
            console.error(
              "[AUTH ERROR] Senha incorreta para:",
              credentials.email
            );
            return null;
          }

          return {
            id: usuario.id.toString(),
            name: usuario.nome,
            email: usuario.email,
            tipo_usuario: usuario.tipo_usuario as TipoUsuario,
            empresa_id: usuario.empresa_id,
          };
        } catch (error) {
          console.error("[AUTH ERROR] Falha na autenticação:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tipo_usuario = (user as ExtendedUser).tipo_usuario;
        token.empresa_id = (user as ExtendedUser).empresa_id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.tipo_usuario = token.tipo_usuario as TipoUsuario;
        session.user.empresa_id = token.empresa_id;
      }
      return session;
    },
  },
};
