# Finance Manager Backend

Express + TypeScript + Prisma REST API for Personal Finance Manager.

## Tech Stack

- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.x
- **ORM:** Prisma 5.x
- **Database:** PostgreSQL 14+
- **Authentication:** JWT
- **Validation:** Zod
- **Testing:** Jest

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # Prisma client
│   │   └── env.ts        # Environment validation
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   └── errorHandler.ts
│   ├── modules/          # Feature modules
│   │   └── auth/         # Authentication module
│   │       ├── auth.schema.ts
│   │       ├── auth.service.ts
│   │       ├── auth.controller.ts
│   │       └── auth.routes.ts
│   ├── utils/            # Utilities
│   │   ├── errors.ts     # Custom error classes
│   │   ├── logger.ts     # Winston logger
│   │   └── response.ts   # Response formatters
│   ├── types/            # TypeScript types
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts           # Database seeding
├── tests/                # Tests
├── .env.example          # Example environment variables
├── tsconfig.json         # TypeScript configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
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

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://finance_user:finance_pass@localhost:5432/financedb
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. (Optional) Seed database with demo data:
```bash
npm run prisma:seed
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## API Endpoints

### Health Check
- `GET /health` - Check API and database status

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user (requires auth)

### Future Modules
- Transactions
- Categories
- Payment Methods
- Recurring Series
- Import (CSV/PDF)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | development |
| `PORT` | Server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | info |

## Database Schema

### Models
- **User** - User accounts
- **Transaction** - Expenses and income
- **Category** - Transaction categories
- **MacroCategory** - Category groups
- **PaymentMethod** - Payment methods
- **RecurringSeries** - Recurring expenses

See `prisma/schema.prisma` for complete schema.

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests:
```bash
npm run test:integration
```

Generate coverage report:
```bash
npm run test:coverage
```

## Production Build

1. Build the application:
```bash
npm run build
```

2. Run migrations:
```bash
npm run prisma:deploy
```

3. Start production server:
```bash
npm start
```

## Docker

Build and run with Docker Compose (from project root):
```bash
docker-compose up -d backend
```

## Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT authentication with expiration
- Rate limiting on auth endpoints (5 requests/15 min)
- Global rate limiting (100 requests/15 min)
- Helmet.js security headers
- Input validation with Zod
- CORS protection
- SQL injection prevention (Prisma ORM)

## Error Handling

The API uses custom error classes and returns consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": []
  }
}
```

Error codes:
- `VALIDATION_ERROR` - Input validation failed (400)
- `UNAUTHORIZED` - Authentication required (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource already exists (409)
- `INTERNAL_ERROR` - Server error (500)

## License

MIT
