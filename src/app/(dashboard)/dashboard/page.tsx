import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function DashboardSwitchboard() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    // Demo User Short-circuit (Explicit Check)
    if (session.user.id === 'demo-user-id' || session.user.email === 'demo@smartgig.com') {
        return redirect("/freelancer/dashboard");
    } else if (session.user.id === 'client-demo-id' || session.user.email === 'client@smartgig.com') {
        return redirect("/client/dashboard");
    } else if (session.user.id === 'admin-demo-id' || session.user.email === 'admin@smartgig.com') {
        return redirect("/admin/dashboard");
    }

    let userRole = session.user.role;

    try {
        // Fetch role from DB to be checking against most recent state
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });

        if (user && user.role) {
            userRole = user.role as "FREELANCER" | "CLIENT" | "ADMIN";
        }
    } catch (error) {
        console.warn("Dashboard Switchboard: DB unavailable. Using session role fallbacks.");
        // Continue using session.user.role
    }

    if (userRole === "CLIENT") {
        redirect("/client/dashboard");
    } else if (userRole === "FREELANCER") {
        redirect("/freelancer/dashboard");
    } else if (userRole === "ADMIN") {
        redirect("/admin/dashboard");
    } else {
        // Default fallback
        redirect("/");
    }
}
