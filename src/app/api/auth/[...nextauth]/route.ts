import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Client } from "pg";
import bcrypt from "bcryptjs";

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

        // Configurações de conexão (variáveis de ambiente)
        const client = new Client({
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_DATABASE,
          password: process.env.DB_PASSWORD,
          // Fornece um valor padrão caso a variável de ambiente não esteja definida
          port: parseInt(process.env.DB_PORT || "6543", 10),
        });

        try {
          await client.connect();

          // Query para buscar o usuário pelo email
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
          await client.end();
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
