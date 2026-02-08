import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"

import { db } from "@/lib/db"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"


export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    adapter: PrismaAdapter(db) as any,
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

                    // Demo User Short-circuit - ZERO DB ACCESS for "demo@smartgig.com"
                    if (email === "demo@smartgig.com" && password === "demo1234") {
                        return {
                            id: "demo-user-id",
                            name: "Demo Freelancer",
                            email: "demo@smartgig.com",
                            role: "FREELANCER",
                            image: "",
                        };
                    } else if (email === "client@smartgig.com" && password === "demo1234") {
                        return {
                            id: "client-demo-id",
                            name: "Demo Client",
                            email: "client@smartgig.com",
                            role: "CLIENT",
                            image: "",
                        };
                    } else if (email === "admin@smartgig.com" && password === "demo1234") {
                        return {
                            id: "admin-demo-id",
                            name: "Demo Admin",
                            email: "admin@smartgig.com",
                            role: "ADMIN",
                            image: "",
                        };
                    }

                    try {
                        const user = await db.user.findUnique({ where: { email } });
                        if (!user || !user.password) return null;

                        const passwordsMatch = await bcrypt.compare(password, user.password);
                        if (passwordsMatch) return user as any;
                    } catch (error) {
                        console.error("Auth DB Error:", error);
                        return null;
                    }
                }
                return null;
            }
        })

    ],
    callbacks: {
        async signIn({ user, account }: any) {
            // Skip for Credentials provider
            if (account && account.provider === 'credentials') return true;

            // Demo User Loophole - allow always
            if (user.email === "demo@smartgig.com" || user.email === "client@smartgig.com" || user.email === "admin@smartgig.com") {
                return true;
            }

            try {
                // Determine Entry Context (Login vs Signup)
                const cookieStore = await cookies(); // Next.js 15
                const context = cookieStore.get('auth_context')?.value || 'login';

                // Check Pre-Existing User Status (Before Adapter creates)
                const existingUser = await db.user.findUnique({
                    where: { email: user.email! },
                    select: { id: true, role: true }
                });

                const userExists = !!existingUser;
                const hasRole = !!existingUser?.role; // Should always be true if user exists (default: FREELANCER)

                console.log(`[AUTH FLOW] provider=${account?.provider} entry=${context} userExists=${userExists} role=${existingUser?.role} email=${user.email}`);


                if (context === 'signup') {
                    if (userExists) {
                        // User exists, but clicked Signup.
                        // We allow login, but notify them.
                        cookieStore.set('oauth_flash', 'account_exists_login', { path: '/', maxAge: 10, httpOnly: false });
                    } else {
                        // New User Signing Up.
                        // Allow creation.
                        // No flash needed, normal onboarding flow takes over.
                    }
                } else if (context === 'login') {
                    if (!userExists) {
                        // User does not exist, but clicked Login.
                        // We allow creation (standard OAuth behavior).
                        // Notify them we created an account.
                        cookieStore.set('oauth_flash', 'new_account_created', { path: '/', maxAge: 10, httpOnly: false });
                    }
                }


                return true;
            } catch (error) {
                console.error("SignIn Callback Error:", error);
                return true; // Fail safe to allow login? Or false to block?
                // Returning true allows NextAuth to handle error or continue.
            }
        },
        async session({ session, token }: any) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }

            if (token.role && session.user) {
                session.user.role = token.role as "FREELANCER" | "CLIENT" | "ADMIN";
            }
            console.log('[Auth Session] Created session for:', {
                id: session.user?.id,
                email: session.user?.email,
                role: session.user?.role
            });
            return session;
        },
        async jwt({ token, user }) {
            // On initial sign-in, user object is available
            if (user) {
                console.log('[Auth JWT] Initial sign-in, user object:', {
                    id: user.id,
                    email: user.email,
                    role: (user as any).role
                });
                token.role = (user as any).role;
            }

            if (!token.sub) return token;

            // Strict Demo Isolation - ZERO DB ACCESS
            if (token.email === "demo@smartgig.com") {
                token.role = "FREELANCER";
                console.log('[Auth JWT] Demo freelancer detected');
                return token;
            } else if (token.email === "client@smartgig.com") {
                token.role = "CLIENT";
                console.log('[Auth JWT] Demo client detected');
                return token;
            } else if (token.email === "admin@smartgig.com") {
                token.role = "ADMIN";
                console.log('[Auth JWT] Demo admin detected');
                return token;
            }

            // Only fetch from DB if role not already set
            if (!token.role) {
                try {
                    const existingUser = await db.user.findUnique({
                        where: { id: token.sub }
                    });

                    if (existingUser) {
                        token.role = existingUser.role as "FREELANCER" | "CLIENT" | "ADMIN";
                        console.log('[Auth JWT] Fetched role from DB:', token.role);
                    }
                } catch (error) {
                    // DB Offline - Retain existing token data
                    console.error("[Auth JWT] DB Error - using cached token data");
                }
            }

            return token;
        }
    }
})
