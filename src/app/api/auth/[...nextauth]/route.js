import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "../../../../libs/db";
import bcrypt from 'bcrypt'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmitch" },
        password: { label: "Password", type: "password", placeholder: "*********" }
      },
      async authorize(credentials) {
        const userFound = await db.user.findUnique({
          where: { email: credentials.email }
        });
        if (!userFound) throw new Error("Usuario no encontrado");

        const matchPassword = await bcrypt.compare(
          credentials.password,
          userFound.password
        );
        if (!matchPassword) throw new Error("Contraseña incorrecta");

        return {
          id: userFound.id,
          name: userFound.username,
          email: userFound.email,
          role: userFound.role,            // 👈 incluye el rol en el user
        };
      },
    }),
  ],

  // 👇 Mueve aquí el bloque callbacks
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;   // agrega el role al token
        token.id = user.id;       // agrega el id del usuario al token
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.role) session.user.role = token.role;
      if (token?.id) session.user.id = token.id;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };