# Finance Manager Frontend

React + TypeScript + Vite frontend for Personal Finance Manager.

## Tech Stack

- **Framework:** React 18
- **Language:** TypeScript 5
- **Build Tool:** Vite 5
- **Styling:** TailwindCSS 3
- **Routing:** React Router v6
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API clients
│   │   ├── client.ts     # Axios instance
│   │   └── auth.api.ts   # Auth endpoints
│   ├── components/       # React components
│   │   └── layout/       # Layout components
│   ├── pages/            # Page components
│   │   ├── auth/         # Auth pages
│   │   └── Dashboard.tsx
│   ├── store/            # Zustand stores
│   │   └── authStore.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── routes.tsx        # App routing
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Features

### Current
- User registration and login
- JWT authentication with auto-refresh
- Protected routes
- Responsive design (mobile-first)

### Coming Soon
- Transaction management
- Category management
- Payment methods
- CSV/PDF import
- Filters and search
- Recurring expenses
- Installments tracking

## Routing

- `/login` - Login page
- `/register` - Registration page
- `/` - Dashboard (protected)

Additional routes will be added for:
- `/transactions` - Transaction list
- `/categories` - Category management
- `/payment-methods` - Payment methods
- `/import` - CSV/PDF import
- `/installments` - Pending installments
- `/recurring` - Recurring expenses

## State Management

The app uses Zustand for global state management:

### Auth Store (`authStore.ts`)
- Stores authentication token and user data
- Persists to localStorage
- Provides login/logout actions

## API Integration

The app communicates with the backend API using Axios:

### API Client (`api/client.ts`)
- Configured with base URL
- Adds JWT token to requests automatically
- Handles 401 errors (logout on token expiration)

### API Modules
- `auth.api.ts` - Authentication endpoints

## Styling

The app uses TailwindCSS for styling with a mobile-first approach:

### Breakpoints
- `sm`: 375px (mobile)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1920px (large desktop)

### Color Scheme
- Primary: Blue (bg-blue-600, etc.)
- Success: Green
- Error: Red
- Neutral: Gray

## Form Validation

Forms use React Hook Form with Zod for validation:

```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:3000/api/v1 |

## Production Build

1. Build the app:
```bash
npm run build
```

2. Preview the build:
```bash
npm run preview
```

The build output will be in the `dist/` directory.

## Docker

Build and run with Docker Compose (from project root):
```bash
docker-compose up -d frontend
```

## Contributing

When adding new features:
1. Create API client functions in `src/api/`
2. Create types in `src/types/`
3. Create components in `src/components/`
4. Create pages in `src/pages/`
5. Add routes in `src/routes.tsx`

## License

MIT
