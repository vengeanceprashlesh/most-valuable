# Most Valuable

A premium e-commerce platform featuring exclusive streetwear, hoodies, and limited-edition merchandise with integrated raffle system and secure checkout.

## 🚀 Features

### Shop Experience
- **Full-Screen Hero Video** - Immersive auto-playing video showcase with manual navigation
- **Product Grid** - Clean, minimal product cards with smooth hover effects
- **Image Carousel** - Auto-sliding product images with click navigation
- **Responsive Design** - Optimized for mobile, tablet, and desktop

### Product Features
- Multiple color variants (Black, White, Gray)
- Product detail pages with image galleries
- Real-time inventory status (Available, Sold Out, Coming Soon)
- Raffle system for exclusive items

### Checkout & Payments
- Secure Stripe integration
- Multi-quantity purchase support
- Email confirmation system via Resend
- Order tracking and management

### Backend
- **Convex** - Real-time database and backend
- Product catalog management
- Order processing
- Customer data handling

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.7 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI:** React 19
- **Database:** Convex
- **Payments:** Stripe
- **Email:** Resend
- **Forms:** React Hook Form + Zod validation

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd most-valuable
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure the following variables:
- `CONVEX_DEPLOYMENT` - Your Convex deployment URL
- `NEXT_PUBLIC_CONVEX_URL` - Public Convex URL
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `RESEND_API_KEY` - Resend API key for emails

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3001](http://localhost:3001) in your browser

## 📂 Project Structure

```
most-valuable/
├── src/
│   ├── app/               # Next.js app router pages
│   │   ├── page.tsx      # Landing page
│   │   ├── shop/         # Shop page with product grid
│   │   ├── product/      # Product detail pages
│   │   └── checkout/     # Checkout flow
│   ├── components/       # Reusable components
│   ├── data/            # Product catalog
│   └── lib/             # Utilities and helpers
├── convex/              # Convex backend functions
├── public/              # Static assets (images, videos)
└── package.json
```

## 🎨 Key Pages

### `/` - Landing Page
Email subscription and brand introduction

### `/shop` - Shop Page
- Full-screen video hero section
- Product grid with 2-4 columns (responsive)
- Auto-sliding product images
- Filter by status and variants

### `/product/[slug]` - Product Details
- Image gallery with thumbnails
- Color variant selection
- Size selection (if applicable)
- Add to cart functionality
- Product description and details

### `/checkout` - Checkout
- Stripe payment integration
- Customer information form
- Order summary
- Email confirmation

## 🔧 Development

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Linting
```bash
npm run lint
```

## 🎯 Product Management

Products are defined in `src/data/products.ts`. Each product includes:
- Unique ID and slug
- Name and description
- Price and status
- Media (images/videos)
- Color variants
- Size options

## 📧 Email System

Powered by Resend, the system sends:
- Order confirmations
- Raffle winner notifications
- Newsletter updates

## 💳 Payment Processing

Stripe integration handles:
- Secure payment processing
- Multiple quantity purchases
- Order tracking
- Refund management

## 🚢 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Railway
- Render
- AWS Amplify
- Netlify

## 📄 License

Private - All rights reserved

## 🤝 Contributing

This is a private project. Contact the owner for collaboration opportunities.

## 📞 Support

For issues or questions, please contact the development team.

---

Built with ❤️ using Next.js and Tailwind CSS
