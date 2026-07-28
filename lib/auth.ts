import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

/**
 * Auth.js (NextAuth v5) — email/mot de passe pour le MVP (voir plan
 * d'implémentation §Auth). Le champ User.phoneNumber existe déjà dans le
 * schéma pour brancher un futur provider SMS/OTP sans migration.
 *
 * Session en stratégie "jwt" : requis par Auth.js dès qu'un provider
 * Credentials est utilisé (les sessions "database" ne le supportent pas).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Sur un hébergeur sans serveur (Netlify, Vercel), la requête arrive via un
  // proxy : sans cette autorisation explicite, Auth.js refuse de déduire l'URL
  // du site et renvoie la page « Server error / problem with the server
  // configuration ». En local, l'hôte est de toute façon de confiance.
  trustHost: true,
  pages: {
    signIn: "/connexion",
  },
  providers: [
    Credentials({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          // On ne rapatrie que le strict nécessaire : la base est distante,
          // chaque colonne inutile coûte de la latence.
          select: { id: true, email: true, name: true, role: true, passwordHash: true },
        });
        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
        // Le rôle voyage dans le jeton : sans cela, chaque rendu de page
        // authentifiée relançait une requête en base juste pour savoir si
        // l'utilisateur est administrateur.
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
        session.user.role = typeof token.role === "string" ? token.role : "USER";
      }
      return session;
    },
  },
});
