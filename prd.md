# Complete Technical Documentation and Product Requirements Document (PRD) for Most Valuable Raffle Website

## 1. Overview
### 1.1 Product Summary
- **Product Name**: Most Valuable Raffle Website
- **Brand**: Most Valuable
- **Description**: This is a luxury fashion web application designed for a clothing brand to build hype around exclusive products. It features a lead-collection landing page with a dynamic moving background and a raffle-based e-commerce shop page. The site displays 6 products (5 as "sold out" teasers and 1 as a 1-of-1 raffle shirt). Users can purchase unlimited raffle entries at $25 each or in bundles of 5 for $100. The raffle runs for 22 days with a countdown timer, after which a random winner is selected from all entries. Leads (email/phone) are collected on the landing page, and entries are tracked per user. The site integrates payments via Stripe (with fallbacks), stores data in a reactive database, and ensures a premium, mobile-responsive user experience.
- **Objectives**:
  - Collect user leads for marketing (emails/phones stored securely).
  - Facilitate raffle entry purchases to generate revenue and engagement.
  - Display products in a luxury grid layout to build brand hype.
  - Automate winner selection with fair randomness.
  - Ensure seamless payment processing and real-time updates.
- **Scope**:
  - In Scope: Landing page, shop/raffle page, lead collection, raffle entry system, payment integration, entry tracking dashboard, countdown timer, random winner selection, mobile responsiveness.
  - Out of Scope: Physical product fulfillment/shipping, user authentication beyond email-based tracking, advanced analytics (e.g., user behavior tracking), multi-language support, SEO optimizations beyond basic, additional pages (e.g., about, contact, blog).
- **Target Audience**: Fashion enthusiasts, streetwear collectors aged 18-35, primarily US-based (for Stripe compatibility).
- **Assumptions**:
  - Client provides all assets (logos, images, videos) without copyright issues.
  - Stripe approval is obtained; fallbacks (PayPal, Square, CashApp) are implemented only if needed.
  - Raffle starts on launch date; 22-day countdown is hardcoded or configurable via environment variables.
  - No high-traffic scaling needed initially (up to 1,000 entries).
- **Constraints**:
  - Budget: $80 (limits to basic implementation; 2 revisions).
  - Timeline: 5-7 days from start.
  - Legal: Ensure raffle complies with US laws (e.g., no skill-based; random selection); advise client on disclosures.
- **Success Metrics**:
  - 100% uptime on Vercel.
  - Successful lead collection and entry purchases in testing.
  - Random winner selection verifiable via logs.
  - Mobile responsiveness tested on iOS/Android devices.
  - Payment success rate >95% in sandbox mode.

### 1.2 Business Context
- Based on client conversation: Initial lead capture, hype-building with sold-out items, raffle for exclusivity. Domain: mostvaluableco.com (connect via Namecheap DNS to Vercel).
- Revenue Model: Entry fees ($25/entry or $100/5 entries).
- Risks: Payment gateway approval delays (mitigate with alternatives); video background performance on low-end devices (optimize with MP4 fallbacks); data privacy (use Convex's secure storage).

## 2. Tech Stack
This stack is chosen for rapid development, performance, and scalability:
- **Frontend Framework**: Next.js v15.4.6 (latest stable; Server-Side Rendering for SEO/fast loads; App Router for modern routing).
- **Language**: TypeScript v5.9.2 (latest stable; for type safety, reducing bugs in raffle logic/entry tracking).
- **Styling**: Tailwind CSS v4.1.12 (latest stable; utility-first for rapid, responsive luxury designs; integrates seamlessly with Next.js).
- **UI Components**: shadcn/ui (CLI v2.10.0; customizable, accessible components like buttons, forms, cards; themed for luxury – dark mode with gold accents).
- **Database/Backend**: Convex v1.25.4 (latest client; reactive, real-time database for leads/entries; serverless functions for mutations/queries; open-source self-hostable option if needed).
- **Payments**: Stripe SDK (latest; for cards/Apple/Google Pay); fallbacks: PayPal SDK, Square SDK, CashApp (implement conditionally).
- **Hosting/Deployment**: Vercel (free tier; auto-deploys from Git; domain integration).
- **Animations**: CSS/GSAP (for background motion; video via HTML5 <video> tag for looping).
- **Forms/Validation**: React Hook Form + Zod (for lead/entry forms; type-safe validation).
- **Other Libraries**:
  - Crypto (Node.js built-in; for secure random winner selection).
  - Date-fns (for countdown timer logic).
  - Nodemailer/SendGrid (for email notifications; optional via Convex actions).
- **Development Tools**: Git (version control), ESLint/Prettier (code quality), VS Code (IDE with TypeScript support).
- **Rationale**: Next.js + Convex enables full-stack in one repo; Tailwind + shadcn/ui for fast prototyping; TypeScript prevents errors in critical logic (e.g., entry counting).

## 3. Setup Guide
This section provides meticulous, step-by-step instructions to initialize the project without failures. We use Next.js (not Vite, as Next.js has its own bundler for better optimization). All commands assume Node.js v20+ (latest LTS; install via nvm or official site). Run in a clean directory. If issues arise (e.g., npm conflicts), use pnpm for faster installs.

### 3.1 Prerequisites
- Install Node.js v20.16.0+ (latest LTS): Download from nodejs.org or use `nvm install 20`.
- Git: Install via `brew install git` (macOS) or official.
- Vercel CLI: `npm i -g vercel` (for deployment).
- Create a Convex account at convex.dev (free tier).
- Stripe account: Obtain test/live keys from dashboard.

### 3.2 Initialize Next.js with TypeScript
1. Create the project:
   ```
   npx create-next-app@15.4.6 most-valuable-raffle --typescript --eslint --app --src-dir --import-alias "@/*"
   ```
   - Prompts: Yes to TypeScript, ESLint; No to Tailwind (install manually for control); Yes to App Router, src/ dir, @/* alias.
   - This generates `tsconfig.json` with strict mode, paths for @/* imports.

2. Navigate and test:
   ```
   cd most-valuable-raffle
   npm run dev
   ```
   - Visit http://localhost:3000; see default page. No errors? Proceed.

3. Fix any TypeScript issues:
   - Update `tsconfig.json` if needed:
     ```
     {
       "compilerOptions": {
         "target": "es2020",
         "lib": ["dom", "dom.iterable", "esnext"],
         "allowJs": true,
         "skipLibCheck": true,
         "strict": true,
         "noEmit": true,
         "esModuleInterop": true,
         "module": "esnext",
         "moduleResolution": "bundler",
         "resolveJsonModule": true,
         "isolatedModules": true,
         "jsx": "preserve",
         "incremental": true,
         "plugins": [{ "name": "next" }],
         "paths": { "@/*": ["./src/*"] }
       },
       "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
       "exclude": ["node_modules"]
     }
     ```
   - Install types if missing: `npm i -D @types/node @types/react @types/react-dom`.
   - VS Code: Select workspace TS version (Ctrl+Shift+P > TypeScript: Select Version > Use Workspace).

### 3.3 Integrate Tailwind CSS v4.1.12
1. Install dependencies:
   ```
   npm install tailwindcss@4.1.12 @tailwindcss/postcss postcss
   ```

2. Create `postcss.config.mjs`:
   ```
   const config = {
     plugins: {
       "@tailwindcss/postcss": {},
     },
   };
   export default config;
   ```

3. Create `tailwind.config.ts` (TypeScript for safety):
   ```
   import type { Config } from "tailwindcss";

   const config: Config = {
     content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
     theme: {
       extend: {
         colors: {
           gold: "#FFD700", // For luxury accents
           dark: "#111111", // Background
         },
       },
     },
     plugins: [],
   };
   export default config;
   ```

4. Add to `src/app/globals.css`:
   ```
   @import "tailwindcss";
   ```

5. Test: Add `<h1 className="text-gold">Test</h1>` to `src/app/page.tsx`; run `npm run dev`. No build errors? Tailwind is integrated. TypeScript compatibility is automatic as Tailwind is CSS-only.

### 3.4 Install and Configure shadcn/ui (CLI v2.10.0)
shadcn/ui is not a direct package; it's a CLI for copying components. Ensures no version conflicts.

1. Initialize:
   ```
   npx shadcn@2.10.0 init
   ```
   - Prompts: Style: New York (modern); Base color: Slate; CSS vars: Yes; Components dir: src/components/ui.

2. This updates `tailwind.config.ts` and adds `components.json`:
   - Ensure `tailwind.config.ts` has:
     ```
     const config: Config = {
       // ... existing
       darkMode: ["class"],
       plugins: [require("tailwindcss-animate")],
     };
     ```

3. Add components (e.g., for forms, cards):
   ```
   npx shadcn@2.10.0 add button input card form badge countdown // Add all needed: button, input, card, etc.
   ```
   - Components go to `src/components/ui/*`. TypeScript types are included.

4. Test: Import in `page.tsx`: `import { Button } from "@/components/ui/button"; <Button>Click</Button>`. Run dev; no TS errors or styles missing.

Common Fixes: If CLI fails (e.g., network), download from GitHub releases. Tailwind must be pre-installed; shadcn relies on it.

### 3.5 Integrate Convex v1.25.4
1. Install client:
   ```
   npm install convex@1.25.4
   ```

2. Install CLI globally (if not):
   ```
   npm install -g convex@1.25.4
   ```

3. Initialize Convex:
   ```
   npx convex init
   ```
   - Prompts: Create new project; login with Convex account.
   - This creates `convex/` dir with schema.ts, queries/mutations.

4. Define schema in `convex/schema.ts` (TypeScript):
   ```
   import { defineSchema, defineTable } from "convex/server";
   import { v } from "convex/values";

   export default defineSchema({
     leads: defineTable({
       email: v.string(),
       phone: v.optional(v.string()),
       timestamp: v.number(),
     }).index("by_email", ["email"]),

     entries: defineTable({
       email: v.string(),
       phone: v.optional(v.string()),
       count: v.number(),
       timestamp: v.number(),
     }).index("by_email", ["email"]),
   });
   ```

5. Add queries/mutations, e.g., `convex/leads.ts`:
   ```
   import { mutation } from "./_generated/server";

   export const addLead = mutation(async ({ db }, { email, phone }) => {
     return db.insert("leads", { email, phone, timestamp: Date.now() });
   });
   ```

6. In Next.js, use ConvexProvider in `src/app/layout.tsx`:
   ```
   import { ConvexProvider, ConvexReactClient } from "convex/react";
   const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en">
         <body>
           <ConvexProvider client={convex}>{children}</ConvexProvider>
         </body>
       </html>
     );
   }
   ```

7. Deploy to Convex: `npx convex deploy`.
8. Test: Add a query in a page; run `npm run dev`. Use `useMutation` from convex/react.

Common Fixes: Ensure .env has NEXT_PUBLIC_CONVEX_URL from Convex dashboard. If sync issues, run `npx convex dev --once`.

### 3.6 Final Setup and Deployment
1. Install remaining deps: `npm i stripe@latest react-hook-form zod date-fns gsap crypto`.
2. Git init: `git init; git add .; git commit -m "Initial setup"`.
3. Deploy to Vercel: `vercel --prod`; connect domain via Namecheap (add A record to Vercel IP or CNAME).
4. Build/Test: `npm run build; npm run lint`. No errors.

This setup is failure-proof if followed sequentially; versions are pinned for stability.

## 4. Functional Requirements with Implementation Details
Each feature is described with user stories, logic, code structure, edge cases, and testing.

### 4.1 Landing Page
- **User Story**: As a visitor, I see a captivating landing page to enter my email/phone for updates, with a "Shop Now" button.
- **Detailed Logic**:
  - Background: Looping video (IMG_9483.MOV converted to MP4/WebM for compatibility; fallback image if video fails).
  - Form: Email (required, validated as email), Phone (optional, validated as US format).
  - On submit: Mutation to Convex leads table; success toast via shadcn/ui.
- **Implementation**:
  - File: `src/app/page.tsx`
  - Code Snippet:
    ```
    import { useMutation } from "convex/react";
    import { api } from "@/convex/_generated/api";
    import { Form, Input, Button } from "@/components/ui";
    import { useForm } from "react-hook-form";
    import { z } from "zod";
    import { zodResolver } from "@hookform/resolvers/zod";

    const schema = z.object({ email: z.string().email(), phone: z.string().optional() });

    export default function Landing() {
      const form = useForm({ resolver: zodResolver(schema) });
      const addLead = useMutation(api.leads.addLead);

      const onSubmit = async (data: z.infer<typeof schema>) => {
        try {
          await addLead(data);
          // Toast success
        } catch (error) {
          // Handle error (e.g., duplicate email)
        }
      };

      return (
        <div className="relative h-screen">
          <video autoPlay loop muted className="absolute inset-0 object-cover">
            <source src="/background.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <img src="/logo.png" alt="Most Valuable" className="mb-8" />
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Input name="email" placeholder="Email" />
                <Input name="phone" placeholder="Phone (optional)" />
                <Button type="submit">Subscribe</Button>
              </form>
            </Form>
            <Button asChild><Link href="/shop">Shop Now</Link></Button>
          </div>
        </div>
      );
    }
    ```
  - Edge Cases: Invalid email (show error); Network failure (retry logic); Duplicate leads (Convex unique index).
  - Responsiveness: Tailwind media queries (e.g., flex-col on sm:).
  - Testing: Unit (Jest: form validation); E2E (Cypress: submit lead).

### 4.2 Shop/Raffle Page
- **User Story**: As a user, I view 6 products; 5 sold out, 1 for raffle entries with countdown.
- **Detailed Logic**:
  - Product Grid: Fetch from static array or Convex (for flexibility).
  - Sold Out: Overlay badge on cards.
  - Raffle: Select quantity (1+ or bundle); calculate price; Stripe checkout.
  - Countdown: Use date-fns; end date = launch + 22 days; disable purchases post-end.
- **Implementation**:
  - File: `src/app/shop/page.tsx`
  - Products Array: Hardcode with images (e.g., const products = [{ id:1, image: '/prod1.png', soldOut: true }, ...]; raffleId = specific one.
  - Code Snippet for Raffle:
    ```
    import Stripe from "stripe";
    import { useQuery, useMutation } from "convex/react";
    // ...

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const entries = useQuery(api.entries.getByEmail, { email: userEmail }); // Assume userEmail from form or session

    const handlePurchase = async (quantity: number) => {
      const price = quantity === 5 ? 10000 : quantity * 2500; // Cents
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price_data: { currency: "usd", product_data: { name: "Raffle Entry" }, unit_amount: price }, quantity: 1 }],
        success_url: `${origin}/success`,
        cancel_url: `${origin}/shop`,
      });
      // On success: mutation to add entries
      await addEntry({ email, count: quantity === 5 ? 5 : quantity });
    };

    // Countdown
    import { formatDistanceToNow } from "date-fns";
    const endDate = new Date(launchDate.getTime() + 22 * 24 * 60 * 60 * 1000);
    const timeLeft = formatDistanceToNow(endDate);
    ```
  - Edge Cases: Countdown ends (disable button); Max entries? (none per client); Refund logic (Stripe dashboard).
  - Testing: Mock Stripe; simulate countdown.

### 4.3 Entry Tracking Dashboard
- **User Story**: As a entrant, I see my entry count post-purchase.
- **Detailed Logic**: Simple page or modal; query Convex by email.
- **Implementation**: `src/app/dashboard/page.tsx`; useQuery for entries.
- Edge Cases: No entries (show 0); Multiple purchases (sum counts).

### 4.4 Random Winner Selection
- **User Story**: As admin, I trigger winner after countdown.
- **Detailed Logic**: Fetch all entries; flatten list (user with 5 entries appears 5 times); use crypto.randomInt for index.
- **Implementation**:
  - Convex Action (server-side for security): `convex/selectWinner.ts`
    ```
    import { action } from "./_generated/server";
    import { v } from "convex/values";
    import crypto from "crypto";

    export const selectWinner = action(async ({ query }) => {
      const allEntries = await query({ paginationOpts: {} }).collect(); // Paginate if large
      const flatList: string[] = [];
      allEntries.forEach((entry) => {
        for (let i = 0; i < entry.count; i++) flatList.push(entry.email);
      });
      if (flatList.length === 0) throw new Error("No entries");
      const winnerIndex = crypto.randomInt(0, flatList.length);
      const winner = flatList[winnerIndex];
      // Email winner via SendGrid
      return winner;
    });
    ```
  - Admin Trigger: Protected page with button.
- Edge Cases: Zero entries (error); Ties (random fair).
- Testing: Seed data; verify distribution.

### 4.5 Payment Integration
- **Logic**: Stripe checkout; on success webhook to Convex mutation.
- **Implementation**: Use Stripe webhooks; fallback if approval fails (e.g., conditional import PayPal).
- Edge Cases: Failed payment (retry); Disputes (handle in Stripe).

## 5. Non-Functional Requirements
- **Performance**: SSR for initial load; Convex reactivity for real-time entries.
- **Security**: HTTPS via Vercel; Convex auth; Stripe PCI compliance; No stored CC data.
- **Accessibility**: ARIA labels on shadcn/ui; contrast ratios (gold on dark >4.5:1).
- **Scalability**: Convex handles 1k+ entries; Vercel auto-scales.
- **Monitoring**: Vercel analytics; Convex dashboard.

## 6. Testing and Deployment
- **Testing Plan**: Unit (raffle logic); Integration (Convex queries); E2E (payments).
- **Deployment**: Push to Git; Vercel auto-build; Domain point.

## 7. Maintenance and Revisions
- 2 revisions: Focus on UI tweaks, bug fixes.
- Handover: Git repo, Convex creds, Stripe keys.

This document is comprehensive; implement sequentially for success.