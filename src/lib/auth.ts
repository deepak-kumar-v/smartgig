import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    ...authConfig,
    providers: [
        ...authConfig.providers,
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await db.user.findUnique({ where: { email } });
                    if (!user || !user.password) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) return user;
                }
                return null;
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                session.user.role = token.role as "FREELANCER" | "CLIENT" | "ADMIN";
            }
            return session;
        },
        async jwt({ token }) {
            if (!token.sub) return token;

            const existingUser = await db.user.findUnique({
                where: { id: token.sub }
            });

            if (!existingUser) return token;

            token.role = existingUser.role;
            return token;
        }
    }
})
