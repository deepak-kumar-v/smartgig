import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

export default {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            // Initial sign in - capture role from user object
            if (user) {
                token.role = user.role;
            }
            // Demo fallback for Edge compatibility
            if (token.email === "demo@smartgig.com") {
                token.role = "FREELANCER";
            } else if (token.email === "client@smartgig.com") {
                token.role = "CLIENT";
            } else if (token.email === "admin@smartgig.com") {
                token.role = "ADMIN";
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token.role && session.user) {
                session.user.role = token.role;
            }
            return session;
        }
    }
} satisfies NextAuthConfig
