# Full Project File Hierarchy
`src` directory structure for SmartGIG as of 2026-01-20

```
src
├── app
│   ├── (auth)
│   │   ├── login
│   │   │   └── page.tsx
│   │   └── register
│   │       ├── client
│   │       │   └── page.tsx
│   │       ├── freelancer
│   │       │   └── page.tsx
│   │       └── page.tsx
│   ├── (dashboard)
│   │   ├── contracts
│   │   │   └── [id]
│   │   │       └── page.tsx
│   │   ├── disputes
│   │   │   ├── [id]
│   │   │   │   └── page.tsx
│   │   │   ├── new
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── freelancer
│   │   │   ├── dashboard
│   │   │   │   └── page.tsx
│   │   │   └── portfolio
│   │   │       └── page.tsx
│   │   ├── messages
│   │   │   ├── messages-layout.tsx
│   │   │   └── page.tsx
│   │   ├── payments
│   │   │   └── page.tsx
│   │   ├── admin
│   │   │   ├── contracts
│   │   │   ├── disputes
│   │   │   ├── jobs
│   │   │   ├── page.tsx
│   │   │   └── users
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (public)
│   │   ├── about
│   │   │   └── page.tsx
│   │   ├── explore
│   │   │   └── page.tsx
│   │   ├── job
│   │   │   └── [id]
│   │   │       └── page.tsx
│   │   └── page.tsx
│   ├── video-call
│   │   └── [roomId]
│   │       └── page.tsx
│   ├── api
│   │   └── auth
│   │       └── [...nextauth]
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── dashboard
│   │   ├── dashboard-header.tsx
│   │   ├── dashboard-sidebar.tsx
│   │   └── dashboard-shell.tsx
│   ├── global
│   │   ├── floating-glass-navbar.tsx
│   │   ├── footer.tsx
│   │   └── navbar.tsx
│   ├── landing
│   │   ├── escrow-section.tsx
│   │   ├── features-section.tsx
│   │   └── hero-section.tsx
│   ├── providers
│   │   └── security-provider.tsx
│   └── ui
│       ├── glass-button.tsx
│       ├── glass-card.tsx
│       ├── glass-input.tsx
│       ├── glass-modal.tsx
│       ├── glass-textarea.tsx
│       └── toast.tsx
├── hooks
│   └── use-device-fingerprint.ts
└── lib
    ├── auth.config.ts
    ├── auth.ts
    ├── db.ts
    ├── security-services.ts
    ├── utils.ts
    └── video-service.ts
```
