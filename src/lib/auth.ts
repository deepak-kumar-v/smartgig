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

            // Strict Demo Check - Prevent Google OAuth from accessing demo accounts
            if (['demo@smartgig.com', 'client@smartgig.com', 'admin@smartgig.com'].includes(user.email)) {
                if (account?.provider === 'google') {
                    console.error('[AUTH ERROR] Attempted Google login with Demo email:', user.email);
                    return false; // Blocking
                }
                return true; // Allow for Credentials
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

                console.log('[OAUTH DEBUG]', {
                    provider: account?.provider,
                    email: user.email,
                    userCreated: userExists, // User exists BEFORE this sign in?
                    accountCreated: false, // Can't know yet
                    resolvedUserId: existingUser?.id || 'new-user',
                    isDemo: false
                });

                if (context === 'signup') {
                    if (userExists) {
                        // User exists, but clicked Signup.
                        cookieStore.set('oauth_flash', 'account_exists_login', { path: '/', maxAge: 10, httpOnly: false });
                    } else {
                        // New User Signing Up.
                        cookieStore.set('oauth_flash', 'signup_new', { path: '/', maxAge: 10, httpOnly: false });
                    }
                } else if (context === 'login') {
                    if (!userExists) {
                        // User does not exist, but clicked Login.
                        cookieStore.set('oauth_flash', 'new_account_created', { path: '/', maxAge: 10, httpOnly: false });
                    } else {
                        // User exists and clicked Login.
                        cookieStore.set('oauth_flash', 'login_existing', { path: '/', maxAge: 10, httpOnly: false });
                    }
                }

                return true;
            } catch (error) {
                console.error("SignIn Callback Error - Blocking Login:", error);
                return false; // Blocking on DB error to prevent ghost sessions
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

            // Always fetch up-to-date role from DB (Fixes Onboarding Stale Session)
            try {
                const existingUser = await db.user.findUnique({
                    where: { id: token.sub },
                    select: { role: true }
                });

                if (existingUser) {
                    token.role = existingUser.role as "FREELANCER" | "CLIENT" | "ADMIN";
                }
            } catch (error) {
                // DB Offline - Retain existing token data from initial sign in
                console.error("[Auth JWT] DB Error - using cached token data");
            }

            return token;
        }
    }
})
