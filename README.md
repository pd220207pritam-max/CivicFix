# 🏙️ CivicFix

**CivicFix** is a modern, responsive Citizen Complaint Management System built with Next.js, React, and Prisma. It empowers citizens to report civic issues (like potholes, garbage, broken streetlights) and allows city administrators to track, manage, and resolve them efficiently.

## 🚀 Features

### For Citizens:
- **Easy Reporting:** Report issues with descriptions, categories, and precise map locations.
- **Real-time Tracking:** Track the status of complaints (Submitted, In Progress, Resolved).
- **Interactive Map:** View nearby complaints on a live map.
- **Notifications:** Get updates when the status of your complaint changes.

### For Administrators:
- **Dashboard Overview:** View analytics, category breakdowns, and recent activities.
- **Department Routing:** Complaints can be assigned to specific departments (e.g., Sanitation, Roads).
- **Issue Management:** Update status, add internal notes, and manage resolutions.
- **Live Map View:** See all city-wide complaints visually to identify hotspots.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS (via custom CSS variables)
- **Backend:** Next.js Server Actions / API Routes
- **Database:** Prisma ORM with PostgreSQL
- **Authentication:** NextAuth.js (Credentials Provider)
- **Maps:** Leaflet & OpenStreetMap

## 💻 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/civicfix.git
   cd civicfix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the environment variables**
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/civicfix"
   NEXTAUTH_SECRET="your-super-secret-key-change-in-production-min-32-chars"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialize the database**
   Run the following commands to generate the Prisma client, push the schema, and seed the initial data (departments and demo users):
   ```bash
   npx prisma generate
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 🔐 Demo Accounts
The database seed script creates the following demo accounts for testing:
- **Admin:** `admin@civicfix.com` / `admin123`
- **Citizen:** `citizen@civicfix.com` / `citizen123`

## 🚀 Deployment

This project is configured to use PostgreSQL. To deploy to a platform like Vercel, simply set your `DATABASE_URL` in your production environment variables to point to your hosted Postgres instance (e.g., Supabase, Neon, or Vercel Postgres).
# CivicFix
