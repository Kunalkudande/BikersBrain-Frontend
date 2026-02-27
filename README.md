# BikersBrain

Premium motorcycle gear e-commerce platform built with React, TypeScript, and Express.

## Tech Stack

### Frontend
- **React 18** + TypeScript + Vite
- **Tailwind CSS** with shadcn/ui component library
- **Framer Motion** for animations
- **React Router DOM** for client-side routing
- **TanStack React Query** for server state management

### Backend
- **Express** + TypeScript
- **Prisma ORM** with PostgreSQL
- **JWT Authentication** (access + refresh tokens with httpOnly cookies)
- **Razorpay** payment integration
- **Cloudinary** image uploads
- **Nodemailer** email service
- **Google Gemini AI** for product autofill
- **Zod** request validation
- **Winston** structured logging

## Project Structure

```
├── frontend/         # React SPA
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── hooks/        # Auth & Cart contexts, custom hooks
│       ├── lib/          # API service layer, utilities
│       └── pages/        # Route pages
│
└── backend/          # Express API server
    ├── prisma/           # Schema, migrations, seed
    └── src/
        ├── config/       # Environment, services config
        ├── controllers/  # Route handlers
        ├── middleware/    # Auth, validation, error handling
        ├── routes/       # Express route definitions
        ├── services/     # Business logic (AI, cache, email, payment, upload)
        ├── types/        # TypeScript type definitions
        └── utils/        # Bcrypt, JWT, logger, validators
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Razorpay account (for payments)
- Cloudinary account (for image uploads)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env    # Configure your environment variables
npx prisma migrate dev  # Run database migrations
npx prisma db seed      # Seed sample data
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on `http://localhost:8080` with API proxy to `http://localhost:5000`.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero, categories, featured products, deals |
| `/products` | Products | Filterable product catalog with pagination |
| `/products/:slug` | Product Detail | Images, variants, specs, reviews |
| `/login` | Login | Email/password authentication |
| `/register` | Register | Account creation |
| `/cart` | Cart | Shopping cart management |
| `/checkout` | Checkout | Address, payment, order placement |
| `/account` | Account | Profile, orders, addresses, security |
| `/wishlist` | Wishlist | Saved products |
| `/blog` | Blog | Blog listing with categories |
| `/blog/:slug` | Blog Post | Full blog article |
| `/about` | About | Brand story |
| `/contact` | Contact | Contact form |

## License

Private — All rights reserved.
