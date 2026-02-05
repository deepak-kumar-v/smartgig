# Route Topology Audit
This document maps all application routes to their function and access level.

| Route | Access Level | Purpose | Status |
|---|---|---|---|
| `/` | Public | Landing Page | ✅ Active |
| `/explore` | Public | Job Search Feed | ✅ Active |
| `/login` | Public | Authentication | ✅ Active |
| `/register` | Public | User Onboarding | ✅ Active |
| `/register/freelancer` | Public | Freelancer Signup | ✅ Active |
| `/register/client` | Public | Client Signup | ✅ Active |
| `/job/[id]` | Public | Job Detail View | ✅ Active |
| `/app/dashboard` | Private (Auth) | Activity Summary | ✅ Active |
| `/app/messages` | Private (Auth) | Chat & Comm | ✅ Active |
| `/app/contacts/[id]` | Private (Auth) | Contract Management | ✅ Active |
| `/app/portfolio` | Private (Provider) | Work Samples | ✅ Active |
| `/app/payments` | Private (Auth) | Wallet & Tx | ✅ Active |
| `/app/disputes` | Private (Auth) | Dispute Dashboard | ✅ Active |
| `/app/disputes/new` | Private (Auth) | File Dispute | ✅ Active |
| `/app/disputes/[id]` | Private (Auth) | Dispute Detail | ✅ Active |
| `/admin` | Private (Admin) | System Overview | ✅ Active |
| `/video-call/[roomId]` | Private (Invited) | Secure Video Conf | ✅ Active |

## Topology validation
- All core workflows have dedicated routes.
- Role-based nesting is implemented via `(dashboard)` grouping.
- Public/Marketing pages are separated in `(public)`.
- Critical features (Video, Disputes) have parameterized routes (`[id]`) for direct linking.
