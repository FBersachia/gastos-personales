# Personal Finance Manager - MVP

Sistema de gestión de gastos personales con importación CSV/PDF, categorización y análisis de transacciones.

## Stack Tecnológico

### Backend
- Node.js 20 LTS
- Express.js + TypeScript
- Prisma ORM
- PostgreSQL 14+
- JWT Authentication

### Frontend
- React 18 + TypeScript
- Vite
- Material-UI / TailwindCSS
- React Router v6
- Zustand (State Management)
- React Query

## Estructura del Proyecto

```
gastos-personales/
├── backend/                      # API REST con Express + TypeScript
├── frontend/                     # SPA con React + TypeScript
├── docker-compose.yml            # Configuración Docker
├── prd.md                        # Product Requirements Document
├── especificacion_funcional.md  # Especificación funcional detallada
├── especificacion_tecnica.md    # Especificación técnica detallada
├── tasklist.md                  # Lista de tareas y roadmap del proyecto
└── SETUP.md                     # Guía de instalación paso a paso
```

## Estado del Proyecto

### ✅ Completado
- Infraestructura base (backend + frontend)
- Sistema de autenticación (registro, login, logout)
- Base de datos configurada con esquema completo
- Seed de datos de prueba

### 🚧 En Desarrollo
Ver [`tasklist.md`](./tasklist.md) para la lista completa de tareas pendientes organizadas por sprints.

### 📋 Próximos Pasos
1. **Sprint 1:** Módulos de Payment Methods y Categories
2. **Sprint 2:** CRUD de Transactions con filtros
3. **Sprint 3:** Sistema de gastos recurrentes
4. **Sprint 4:** Tracking de cuotas pendientes
5. **Sprint 5:** Importación CSV
6. **Sprint 6:** Importación PDF

Para más detalles, consultar [`tasklist.md`](./tasklist.md).

## Setup Rápido con Docker

### Prerequisitos
- Docker y Docker Compose instalados
- Node.js 20+ (para desarrollo local sin Docker)

### Iniciar con Docker

1. Clonar el repositorio
```bash
git clone <repository-url>
cd Gastos-personales
```

2. Iniciar todos los servicios
```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en `localhost:5432`
- Backend API en `http://localhost:3000`
- Frontend en `http://localhost:5173`

3. Ejecutar migraciones de base de datos
```bash
docker-compose exec backend npx prisma migrate deploy
```

4. (Opcional) Seed de datos iniciales
```bash
docker-compose exec backend npx prisma db seed
```

### Ver logs
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Detener servicios
```bash
docker-compose down

# Detener y eliminar volúmenes (elimina la base de datos)
docker-compose down -v
```

## Setup Local (sin Docker)

### Backend

1. Navegar a la carpeta backend
```bash
cd backend
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Ejecutar migraciones
```bash
npx prisma migrate dev
```

5. Iniciar servidor de desarrollo
```bash
npm run dev
```

Backend disponible en `http://localhost:3000`

### Frontend

1. Navegar a la carpeta frontend
```bash
cd frontend
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con la URL de tu backend
```

4. Iniciar servidor de desarrollo
```bash
npm run dev
```

Frontend disponible en `http://localhost:5173`

## Testing

### Backend
```bash
cd backend
npm test                  # Unit tests
npm run test:integration  # Integration tests
npm run test:coverage     # Coverage report
```

### Frontend
```bash
cd frontend
npm test                  # Unit tests
npm run test:e2e          # E2E tests con Cypress
```

## Build para Producción

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Los archivos estáticos estarán en dist/
```

## API Documentation

La documentación de la API está disponible en:
- Desarrollo: `http://localhost:3000/api-docs`
- Endpoints principales en `especificacion_tecnica.md`

## Características Principales

- Autenticación JWT multiusuario
- CRUD de transacciones (gastos/ingresos)
- Importación CSV con filtrado previo
- Lectura de PDFs de resúmenes bancarios
- Gestión de categorías y macrocategorías
- Gestión de métodos de pago
- Gastos recurrentes
- Visualización de cuotas pendientes
- Filtros avanzados
- Diseño responsive mobile-first

## Licencia

MIT
