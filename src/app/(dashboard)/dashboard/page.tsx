import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function DashboardSwitchboard() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    // Fetch role from DB to be checking against most recent state (optional, session role is usually enough)
    // For robustness:
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (!user) return redirect("/login");

    if (user.role === "CLIENT") {
        redirect("/client/dashboard");
    } else if (user.role === "FREELANCER") {
        redirect("/freelancer/dashboard");
    } else {
        // Default fallback
        redirect("/"); // or generic dashboard
    }
}
