# Design(s) (Software Architecture)

## 1. Architectural Pattern: Modular Monolith
*   **Architecture Type:** Modular Monolith
*   **Why Chosen:**
    *   **Unified Codebase:** Frontend and Backend live together in Next.js, simplifying development and deployment.
    *   **Type Safety:** Shared TypeScript types between client and server prevent data consistency errors.
    *   **Scalability:** Logic involves distinct modules (Auth, Jobs, Chat) that can be separated into microservices later if scaling is needed.

## 2. Three-Tier Architecture Implementation

### A. Presentation Layer (Client-Side)
*   **Technology:** React 19 (Client Components)
*   **Responsibility:**
    *   Rendering the User Interface (Pages, Modals, Forms).
    *   Managing local state (Inputs, Toggles) via React Hooks.
    *   Handling user interactions and animations (Framer Motion).
*   **Key Design:** "Glassmorphism" UI design system implemented via Tailwind CSS.

### B. Application Layer (Server-Side)
*   **Technology:** Next.js App Router (Server Actions) + Node.js Custom Server
*   **Responsibility:**
    *   **Business Logic:** Processing job posts, calculating fees, handling contract states.
    *   **Authentication:** Verifying user identity via NextAuth.js (JWT).
    *   **Real-Time Gateway:** Managing WebSocket connections for Chat and Video signaling.
    *   **Validation:** Ensuring all incoming data meets strict schema rules (Zod) before processing.

### C. Data Layer (Storage)
*   **Technology:** PostgreSQL 18
*   **Responsibility:** Reliable, persistent storage of structured data.
*   **Access Pattern:** Prisma ORM acts as the bridge, translating TypeScript objects into optimized SQL queries.
*   **Data Models:** Users, Profiles, Jobs, Proposals, Contracts, Messages, Logs.

## 3. Real-Time Communication Design
*   **Protocol:** WebSockets (Socket.IO)
*   **Connection Flow:**
    1.  User logs in -> Server validates session.
    2.  Socket connection established via custom server entry point.
    3.  User's socket joins specific "Rooms" (e.g., `room_contract_123`).
*   **Security:** Middleware intercepts the handshake to ensure only authorized participants can join a chat room.

## 4. Hardware Requirements (Host & Client)
Since this is a web-based software solution, hardware design focuses on the hosting environment and client access.

*   **Server (Hosting Environment):**
    *   Can run on any standard cloud VM (AWS EC2, DigitalOcean) or Serverless Edge (Vercel).
    *   **Requirement:** Node.js runtime support, PostgreSQL database instance.
    
*   **Client (User Device):**
    *   **Device Agnostic:** Accessible via any modern web browser (Chrome, Edge, Safari).
    *   **Responsive Design:** Layout adapts to Desktops, Tablets, and Mobile phones automatically.
