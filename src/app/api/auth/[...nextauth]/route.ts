import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Pool de conexões
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

const handler = NextAuth({
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

        let client;
        try {
          client = await pool.connect();

          // Buscar o usuário pelo email
          const res = await client.query(
            'SELECT * FROM "Usuario" WHERE email = $1',
            [credentials.email]
          );
          const usuario = res.rows[0];

          if (!usuario) {
            return null;
          }

          // Comparar a senha fornecida com a senha hash do banco de dados
          const senhaValida = await bcrypt.compare(
            credentials.password,
            usuario.senhaHash
          );

          if (!senhaValida) {
            return null;
          }

          return {
            id: usuario.id.toString(),
            name: usuario.nome,
            email: usuario.email,
          };
        } catch (error) {
          console.error("Erro na autenticação:", error);
          return null;
        } finally {
          if (client) {
            client.release();
          }
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
