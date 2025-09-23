import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
    pages: {
        signIn: '/login',
    },
    providers: [
    CredentialsProvider({
        name: 'Credentials',
        credentials: {
        email: { label: "Email", type: "email"},
        password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
            if(!credentials){
                return null
            }

            if(credentials.email === "admin@teste.com" && 
                credentials.password === "Teste123$"){
                return{
                    id: "1",
                    name: "Admin",
                    email: "admin@teste.com",
                }
            }

            return null
        }
    })
  ]
})

export { handler as GET, handler as POST }
