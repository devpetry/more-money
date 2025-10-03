import { NextAuthOptions, DefaultUser, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "./db";

// Define os campos customizados que esperamos do banco de dados
interface ExtendedUser extends DefaultUser {
  id: string;
  tipo_usuario: number;
  empresa_id: number | null;
}
// Define a tipagem da sessão (para uso no useSession e getServerSession)
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: ExtendedUser;
  }
}

// Define os campos que serão incluídos no JWT
declare module "next-auth/jwt" {
  interface JWT {
    tipo_usuario: number;
    empresa_id: number | null;
  }
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
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        try {
          // Buscar o usuário pelo email
          const res = await query(
            'SELECT id, nome, email, "senhaHash", "tipo_usuario", "empresa_id" FROM "Usuario" WHERE email = $1',
            [credentials.email]
          );
          const usuario = res[0];

          if (!usuario) {
            return null;
          }

          // Comparar a senha
          const senhaValida = await bcrypt.compare(
            credentials.password,
            usuario.senhaHash
          );

          if (!senhaValida) {
            return null;
          }

          // Retorna os dados do usuário
          return {
            id: usuario.id.toString(),
            name: usuario.nome,
            email: usuario.email,
            tipo_usuario: usuario.tipo_usuario,
            empresa_id: usuario.empresa_id,
          } as ExtendedUser;
        } catch (error) {
          console.error("Erro na autenticação:", error);
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
        session.user.tipo_usuario = token.tipo_usuario;
        session.user.empresa_id = token.empresa_id;
      }
      return session;
    },
  },
};
