import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

/**
 * RBAC Middleware for SmartGIG
 * 
 * Uses auth.config.ts instead of auth.ts to avoid Edge Runtime issues with bcryptjs
 * 
 * Route protection:
 * - /freelancer/* → FREELANCER only
 * - /client/* → CLIENT only  
 * - /admin/* → ADMIN only
 * - Auth routes → Redirect if logged in
 */

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl, auth: session } = req;
    const pathname = nextUrl.pathname;

    // Public routes - no auth required
    const publicRoutes = [
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/explore',
        '/talent',
        '/pricing',
        '/about',
        '/contact',
        '/job',
        '/services',
        '/access-denied',
        '/verify-email',
        '/verify-phone',
    ];

    // Check if path starts with any public route
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route ||
        pathname.startsWith(`${route}/`) ||
        pathname.startsWith('/api/auth')
    );

    // Auth routes - redirect to dashboard if already logged in
    const authRoutes = ['/login', '/register', '/forgot-password'];
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // Role check
    const userRole = session?.user?.role as string | undefined;
    const isLoggedIn = !!session?.user;

    // If on auth route and logged in, redirect to appropriate dashboard
    // ONLY if they have a valid known role. Otherwise let them stay on auth page to re-login.
    // If on auth route and logged in, redirect to appropriate dashboard
    // ONLY if they have a valid known role. Otherwise let them stay on auth page to re-login.
    /* 
    if (isAuthRoute && isLoggedIn && userRole) {
        let dashboardUrl = '/freelancer/dashboard'; // Default

        if (userRole === 'ADMIN') dashboardUrl = '/admin/dashboard';
        else if (userRole === 'CLIENT') dashboardUrl = '/client/dashboard';
        else if (userRole === 'FREELANCER') dashboardUrl = '/freelancer/dashboard';
        else {
            // Unknown role - do not redirect, allow access to logout/login
            return;
        }

        return Response.redirect(new URL(dashboardUrl, nextUrl));
    }
    */

    // Public routes - allow all
    if (isPublicRoute) {
        return;
    }

    // Protected routes - require login
    if (!isLoggedIn) {
        // Redirect to login with callback URL
        const loginUrl = new URL('/login', nextUrl);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return Response.redirect(loginUrl);
    }

    // Role-based route protection
    // Freelancer routes
    if (pathname.startsWith('/freelancer')) {
        if (userRole !== 'FREELANCER') {
            return Response.redirect(new URL('/access-denied?reason=role', nextUrl));
        }
    }

    // Client routes
    if (pathname.startsWith('/client')) {
        if (userRole !== 'CLIENT') {
            return Response.redirect(new URL('/access-denied?reason=role', nextUrl));
        }
    }

    // Admin routes
    if (pathname.startsWith('/admin')) {
        if (userRole !== 'ADMIN') {
            return Response.redirect(new URL('/access-denied?reason=admin', nextUrl));
        }
    }

    return;
});

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - /uploads (user-uploaded static files)
         */
        '/((?!_next/static|_next/image|favicon\\.ico|uploads).*)',
    ],
};
