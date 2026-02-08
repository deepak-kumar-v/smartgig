# Implementation Plan: Fix Signup → Access Denied Bug

## 1. Root Cause Analysis
The issue is a **Client-Side Cookie Staleness** problem that specifically affects Middleware.

*   **The Chain**:
    1.  **Signup (OAuth)**: NextAuth issues a signed JWT cookie with default role `FREELANCER` (from schema/initial user object).
    2.  **Onboarding (Client Action)**: Updates the database role to `CLIENT`. However, the **browser's cookie remains specific to the old `FREELANCER` state**.
    3.  **The Check (Middleware)**: Redirect happens to `/client/dashboard`.
        *   `src/middleware.ts` uses `auth.config.ts` (Edge-compatible, **No Database Access**).
        *   It reads the *existing cookie*, sees `role: FREELANCER`.
        *   It correctly denies access to the Client route.

Even though `src/lib/auth.ts` (Node runtime) was fixed to always fetch the latest role from the DB, **Middleware cannot run that logic**. It trusts the cookie. Therefore, the cookie itself *must* be updated before the redirect occurs.

## 2. Proposed Implementation Plan

### Strategy: Client-Side Session Refresh (Recommended)
We will trigger a session update from the client immediately after the onboarding action succeeds. This forces NextAuth to:
1.  Call the backend `/api/auth/session` endpoint.
2.  Run the Node-side `jwt` callback (which now fetches the correct role from the DB).
3.  Issue a **new, updated session cookie** to the browser.
4.  Only *then* redirect to the dashboard.

### Steps to Implement

1.  **Modify `src/app/(onboarding)/onboarding/page.tsx`**:
    *   Import `useSession` from `next-auth/react`.
    *   Destructure `update` from `useSession()`.
    *   In `handleContinue`, after `completeOnboarding` returns success:
        ```typescript
        const { update } = useSession();
        // ...
        await update(); // This waits for the new cookie to be set
        router.push('/dashboard');
        ```

2.  **Verify `src/lib/auth.ts` (Already Done)**:
    *   Ensure the `jwt` callback is set to **always** fetch the role from the DB (removed the `if (!token.role)` check). The logic deployed earlier ensures that when `update()` is called, the DB is queried and the new role is stamped into the token.

## 3. Comparison of Approaches

| Approach | Pros | Cons | Verdict |
| :--- | :--- | :--- | :--- |
| **A. Client `update()`** | **Standard NextAuth pattern.** Updates cookie reliably. | Adds ~100ms latency before redirect. | **Recommended** |
| **B. Server Redirect** | Faster. | **Does not update cookie.** Middleware will still block the request. | Invalid |
| **C. Remove Middleware** | Immediate. | Reduces security. Relying on layout checks is less robust. | Unsafe |

## 4. Risks & Verification
*   **Risk**: If `useSession` is not available (e.g. missing `SessionProvider`), this will fail. (Verified: `layout.tsx` wraps app in `Providers` -> `SessionProvider`).
*   **Edge Case**: Network failure during `update()`. The user might stay on onboarding. We can catch this and redirect anyway (Layout will handle it eventually, though Middleware might block once).
*   **Verification**:
    *   Signup as Client -> Wait for Update -> Middleware sees Client Cookie -> Success.
