# Brain Training App 🧠

A local-first cognitive training application designed to improve mental math and visual memory. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Mental Math Coach**: Customizable arithmetic training with adaptive difficulty.
- **Memory Game**: Visual memory exercises with card matching.
- **AI Integration**: Personalized coaching feedback using OpenAI (optional, bring your own key).
- **Secure Login**: Email/password authentication with JWT-based sessions.
- **Cloud Sync**: Player profiles and sessions persist in Neon Postgres via Vercel serverless functions (with local caching for offline reads).
- **Progress Tracking**: Detailed statistics, charts, and achievement badges.
- **PWA Ready**: Installable on mobile and desktop.

## Tech Stack

- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lofp34/brain_app.git
   cd brain_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Database & Authentication

The app ships with Vercel functions that talk directly to Neon using the serverless driver. The schema is auto-created on first request.

### Environment variables

- `DATABASE_URL`: Provided automatically when you connect your Vercel project to Neon. You can also supply it locally by exporting the Postgres connection string.
- `AUTH_SECRET`: A secret string used to sign JWTs. Set this in Vercel (Project Settings → Environment Variables) and in your local shell when developing the API routes.

### API routes

- `POST /api/auth-register` — create an account (`name`, `email`, `password`).
- `POST /api/auth-login` — sign in and retrieve profile + recent sessions.
- `GET /api/profile` — fetch the authenticated profile.
- `PUT /api/profile` — update `name` or `settings` JSON.
- `GET /api/sessions` — list the last 50 sessions for the user.
- `POST /api/sessions` — persist a new game session and update streak stats.

The frontend stores the issued bearer token in `localStorage` and uses it to fetch the profile and keep session data in sync with Neon.

## AI Configuration

To enable AI coaching:
1. Go to **Settings** (Gear icon).
2. Enter your OpenAI API Key.
3. Save. The key is stored safely in your browser's local storage.

## License

MIT
