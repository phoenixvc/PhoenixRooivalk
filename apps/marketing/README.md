# Phoenix Rooivalk Marketing Site

This is the marketing website for Phoenix Rooivalk, built with Next.js 14.

## Authentication and Career Applications

### Overview

The site now includes a user authentication system that integrates with the backend API for career applications.

### Features

1. **Email-based Authentication**: Users can sign in with just their email address
2. **Name Auto-population**: Names are automatically extracted from email addresses when possible (e.g., `john.doe@example.com` → John Doe)
3. **Team Member Detection**: The system automatically identifies team members and prevents them from applying for positions
4. **Session Management**: User sessions are stored and managed securely

### Flow

1. **Login** (`/login`):
   - User enters their email
   - System creates or retrieves user account
   - Session is created and stored in localStorage
   - User is redirected to `/contact#careers`

2. **Career Application** (`/contact#careers`):
   - **Not logged in**: Shows "Sign In to Apply" button
   - **Logged in (non-team member)**: Shows application form with auto-populated user info
   - **Logged in (team member)**: Shows welcome message, no application form

### Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `NEXT_PUBLIC_API_URL` if needed:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

3. Ensure the API is running (see `apps/api/README.md`)

4. Run the development server:
   ```bash
   pnpm dev
   ```

### API Endpoints Used

- `POST /auth/login`: Login/register user
- `GET /auth/me`: Get current user info
- `POST /career/apply`: Submit career application
- `POST /admin/seed-team-members`: Seed initial team members (admin only)

### Team Members

Team members are seeded from the backend with the following data:
- Jurie Smit (CIO) - `smit.jurie@gmail.com`
- Chanelle Fellinger (CMO) - `chanelle.fellinger@gmail.com`
- Martyn (COO) - `martyn@phoenixrooivalk.com`
- Pieter (CTO) - `pieter@phoenixrooivalk.com`
- Eben (CFO) - `eben@phoenixrooivalk.com`

### Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run linter
pnpm lint

# Run type checking
pnpm typecheck

# Build for production
pnpm build
```

## Testing the Authentication Flow

1. Start the API server:
   ```bash
   cd apps/api
   cargo run
   ```

2. Seed team members (one-time setup):
   ```bash
   curl -X POST http://localhost:8080/admin/seed-team-members
   ```

3. Start the marketing site:
   ```bash
   cd apps/marketing
   pnpm dev
   ```

4. Test the flow:
   - Navigate to `http://localhost:3000/login`
   - Login with a non-team email (e.g., `test@example.com`)
   - You'll be redirected to `/contact#careers`
   - Fill out and submit the application form

5. Test team member flow:
   - Login with a team member email (e.g., `smit.jurie@gmail.com`)
   - You'll see a welcome message instead of the application form
