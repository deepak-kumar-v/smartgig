import NextAuth, { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            role: "FREELANCER" | "CLIENT" | "ADMIN"
        } & DefaultSession["user"]
    }

    interface User {
        role: "FREELANCER" | "CLIENT" | "ADMIN"
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: "FREELANCER" | "CLIENT" | "ADMIN"
    }
}
