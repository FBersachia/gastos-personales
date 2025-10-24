# Especificación Técnica - Sistema de Gestión de Gastos Personales

## 1. Información del Documento

**Versión:** 1.0  
**Fecha:** 24 de Octubre de 2025  
**Autor:** Analista Funcional Sr.  
**Proyecto:** Personal Finance Manager - MVP  

---

## 2. Arquitectura General

### 2.1 Visión General

El sistema seguirá una arquitectura de tres capas con separación clara entre frontend, backend y base de datos.

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                       │
│         React + TypeScript + Vite               │
│         UI Components + State Management        │
└─────────────────┬───────────────────────────────┘
                  │ REST API / HTTP
                  │ JSON
┌─────────────────▼───────────────────────────────┐
│                  BACKEND                        │
│         Node.js + Express + TypeScript          │
│         Business Logic + Authentication         │
└─────────────────┬───────────────────────────────┘
                  │ Prisma ORM
                  │ SQL
┌─────────────────▼───────────────────────────────┐
│              BASE DE DATOS                      │
│              PostgreSQL 14+                     │
│              Relational Database                │
└─────────────────────────────────────────────────┘
```

### 2.2 Stack Tecnológico

#### Frontend
- **Framework:** React 18+
- **Lenguaje:** TypeScript 5+
- **Build Tool:** Vite 5+
- **UI Library:** Material-UI (MUI) v5 o TailwindCSS v3
- **State Management:** Zustand o React Query
- **Routing:** React Router v6
- **Form Management:** React Hook Form + Zod (validación)
- **HTTP Client:** Axios
- **Date Handling:** date-fns o Day.js

#### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4+
- **Lenguaje:** TypeScript 5+
- **ORM:** Prisma 5+
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Validation:** Zod
- **File Upload:** Multer
- **PDF Processing:** pdf-parse o pdfjs-dist
- **CSV Processing:** csv-parser o PapaParse

#### Base de Datos
- **SGBD:** PostgreSQL 14+
- **Migraciones:** Prisma Migrate

#### DevOps & Tooling
- **Containerización:** Docker + Docker Compose (para desarrollo)
- **Testing:** Jest + React Testing Library
- **Linting:** ESLint + Prettier
- **Version Control:** Git
- **CI/CD:** (A definir según plataforma de deploy)

---

## 3. Modelo de Datos

### 3.1 Diagrama Entidad-Relación

```
┌─────────────┐
│    User     │
├─────────────┤
│ id          │──┐
│ email       │  │
│ password    │  │
│ createdAt   │  │
│ updatedAt   │  │
└─────────────┘  │
                 │
    ┌────────────┴───────────────┬──────────────────┬──────────────────┐
    │                            │                  │                  │
    ▼                            ▼                  ▼                  ▼
┌──────────────┐      ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│PaymentMethod │      │  Category    │   │MacroCategory │   │ Transaction  │
├──────────────┤      ├──────────────┤   ├──────────────┤   ├──────────────┤
│ id           │      │ id           │   │ id           │   │ id           │
│ userId       │──┐   │ name         │   │ name         │   │ date         │
│ name         │  │   │ userId       │──┐│ userId       │──┐│ type         │
│ createdAt    │  │   │ macroId      │─┼┼────────────────┘ ││ description  │
│ updatedAt    │  │   │ createdAt    │  ││ createdAt    │  ││ amount       │
└──────────────┘  │   │ updatedAt    │  │└──────────────┘  ││ userId       │
                  │   └──────────────┘  │                  ││ categoryId   │──┘
                  │                     │                  ││ paymentId    │──┘
                  │                     │                  ││ installments │
                  │                     │                  ││ seriesId     │──┐
                  │                     │                  ││ createdAt    │  │
                  │                     │                  ││ updatedAt    │  │
                  │                     │                  │└──────────────┘  │
                  │                     │                  │                  │
                  └─────────────────────┴──────────────────┘                  │
                                                                              │
                                                            ┌─────────────────┘
                                                            │
                                                            ▼
                                                   ┌──────────────┐
                                                   │RecurringSeries│
                                                   ├──────────────┤
                                                   │ id           │
                                                   │ name         │
                                                   │ userId       │
                                                   │ frequency    │
                                                   │ createdAt    │
                                                   │ updatedAt    │
                                                   └──────────────┘
```

### 3.2 Schema de Prisma

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// MODELS
// ============================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // hashed with bcrypt
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  transactions      Transaction[]
  paymentMethods    PaymentMethod[]
  categories        Category[]
  macroCategories   MacroCategory[]
  recurringSeries   RecurringSeries[]

  @@map("users")
}

model PaymentMethod {
  id        String   @id @default(uuid())
  name      String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@unique([userId, name])
  @@index([userId])
  @@map("payment_methods")
}

model MacroCategory {
  id        String   @id @default(uuid())
  name      String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  categories Category[]

  @@unique([userId, name])
  @@index([userId])
  @@map("macro_categories")
}

model Category {
  id        String   @id @default(uuid())
  name      String
  userId    String
  macroId   String?  // nullable: category can exist without macro
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  macroCategory  MacroCategory? @relation(fields: [macroId], references: [id], onDelete: SetNull)
  transactions   Transaction[]

  @@unique([userId, name])
  @@index([userId])
  @@index([macroId])
  @@map("categories")
}

model RecurringSeries {
  id        String   @id @default(uuid())
  name      String   // e.g., "Alquiler", "Seguro Auto"
  frequency String   // "MONTHLY", "ANNUAL", etc. (informative)
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@unique([userId, name])
  @@index([userId])
  @@map("recurring_series")
}

model Transaction {
  id           String   @id @default(uuid())
  date         DateTime
  type         String   // "INCOME" or "EXPENSE"
  description  String   @db.Text
  amount       Decimal  @db.Decimal(12, 2) // always positive, type determines sign
  installments String?  // format: "n1/n2" or null
  userId       String
  categoryId   String
  paymentId    String
  seriesId     String?  // nullable: transaction can be standalone
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  category        Category         @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  paymentMethod   PaymentMethod    @relation(fields: [paymentId], references: [id], onDelete: Restrict)
  recurringSeries RecurringSeries? @relation(fields: [seriesId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([date])
  @@index([categoryId])
  @@index([paymentId])
  @@index([seriesId])
  @@index([userId, date])
  @@map("transactions")
}
```

### 3.3 Reglas de Integridad

#### Relaciones y Cascadas

1. **User → [PaymentMethod, Category, MacroCategory, RecurringSeries, Transaction]**
   - `onDelete: Cascade`: Si se elimina un usuario, se eliminan todos sus datos

2. **Category → Transaction**
   - `onDelete: Restrict`: No se puede eliminar una categoría si tiene transacciones asociadas
   - Solución: Usuario debe reasignar o eliminar transacciones primero

3. **PaymentMethod → Transaction**
   - `onDelete: Restrict`: No se puede eliminar un método de pago si tiene transacciones asociadas

4. **MacroCategory → Category**
   - `onDelete: SetNull`: Si se elimina una macrocategoría, las categorías quedan sin macro (se setea NULL)

5. **RecurringSeries → Transaction**
   - `onDelete: SetNull`: Si se elimina una serie, las transacciones quedan standalone

#### Constraints Únicos

- **User.email**: Único a nivel global
- **PaymentMethod.name**: Único por usuario
- **Category.name**: Único por usuario
- **MacroCategory.name**: Único por usuario
- **RecurringSeries.name**: Único por usuario

#### Índices

- Índices simples en todas las foreign keys
- Índice compuesto en `[userId, date]` para optimizar consultas de listado filtrado
- Índices en campos de búsqueda frecuente: `date`, `categoryId`, `paymentId`

---

## 4. API REST - Especificación de Endpoints

### 4.1 Convenciones Generales

- **Base URL:** `http://localhost:3000/api/v1`
- **Content-Type:** `application/json`
- **Authentication:** Bearer token en header `Authorization: Bearer <token>`
- **HTTP Status Codes:**
  - `200 OK`: Operación exitosa
  - `201 Created`: Recurso creado exitosamente
  - `400 Bad Request`: Error de validación
  - `401 Unauthorized`: No autenticado
  - `403 Forbidden`: No autorizado
  - `404 Not Found`: Recurso no encontrado
  - `409 Conflict`: Conflicto (ej: email duplicado)
  - `500 Internal Server Error`: Error del servidor

### 4.2 Formato de Respuestas

#### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Response
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

#### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1159,
    "totalPages": 47
  }
}
```

---

### 4.3 Endpoints de Autenticación

#### POST /auth/register
Registra un nuevo usuario.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@example.com",
      "createdAt": "2025-10-24T10:00:00Z"
    }
  }
}
```

**Errores:**
- `400`: Validación fallida (email inválido, contraseña corta)
- `409`: Email ya registrado

---

#### POST /auth/login
Inicia sesión y devuelve token JWT.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "usuario@example.com"
    }
  }
}
```

**Errores:**
- `401`: Credenciales inválidas

---

#### POST /auth/logout
Invalida el token actual (si se implementa blacklist).

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### 4.4 Endpoints de Métodos de Pago

#### GET /payment-methods
Lista todos los métodos de pago del usuario.

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Visa Santander",
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-01T10:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Efectivo",
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

---

#### POST /payment-methods
Crea un nuevo método de pago.

**Request Body:**
```json
{
  "name": "Débito BBVA"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Débito BBVA",
    "createdAt": "2025-10-24T10:00:00Z",
    "updatedAt": "2025-10-24T10:00:00Z"
  }
}
```

**Errores:**
- `400`: Nombre vacío o inválido
- `409`: Nombre duplicado para este usuario

---

#### PUT /payment-methods/:id
Actualiza un método de pago existente.

**Request Body:**
```json
{
  "name": "Visa Santander Select"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Visa Santander Select",
    "updatedAt": "2025-10-24T10:05:00Z"
  }
}
```

**Errores:**
- `404`: Método no encontrado
- `409`: Nombre duplicado

---

#### DELETE /payment-methods/:id
Elimina un método de pago.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Payment method deleted successfully"
  }
}
```

**Errores:**
- `404`: Método no encontrado
- `409`: Hay transacciones asociadas (Restrict constraint)

---

### 4.5 Endpoints de Categorías

#### GET /categories
Lista todas las categorías del usuario con sus macrocategorías.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Comida",
      "macroCategory": {
        "id": "uuid",
        "name": "Alimentación"
      },
      "transactionCount": 150,
      "createdAt": "2025-01-01T10:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Transporte",
      "macroCategory": null,
      "transactionCount": 45,
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

---

#### POST /categories
Crea una nueva categoría.

**Request Body:**
```json
{
  "name": "Almuerzo",
  "macroId": "uuid" // optional
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Almuerzo",
    "macroId": "uuid",
    "createdAt": "2025-10-24T10:00:00Z"
  }
}
```

---

#### PUT /categories/:id
Actualiza una categoría.

**Request Body:**
```json
{
  "name": "Almuerzos",
  "macroId": "uuid" // optional, null to unlink
}
```

---

#### DELETE /categories/:id
Elimina una categoría.

**Errores:**
- `409`: Hay transacciones asociadas (Restrict)

---

### 4.6 Endpoints de Macrocategorías

#### GET /macro-categories
Lista todas las macrocategorías del usuario.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Alimentación",
      "categoryCount": 5,
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

---

#### POST /macro-categories
Crea una nueva macrocategoría.

**Request Body:**
```json
{
  "name": "Hogar"
}
```

---

#### PUT /macro-categories/:id
Actualiza una macrocategoría.

---

#### DELETE /macro-categories/:id
Elimina una macrocategoría (las categorías quedan sin macro).

---

### 4.7 Endpoints de Transacciones

#### GET /transactions
Lista transacciones con filtros y paginación.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 25, max: 100)
- `dateFrom` (ISO 8601, optional)
- `dateTo` (ISO 8601, optional)
- `categoryIds` (comma-separated UUIDs, optional)
- `paymentMethodIds` (comma-separated UUIDs, optional)
- `type` ("INCOME" | "EXPENSE" | "ALL", default: "ALL")
- `seriesId` (UUID, optional) - filter by recurring series

**Example:**
```
GET /transactions?page=1&limit=25&dateFrom=2025-01-01&dateTo=2025-10-31&categoryIds=uuid1,uuid2
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2025-10-23T00:00:00Z",
      "type": "EXPENSE",
      "description": "Metrogas coima",
      "amount": "10000.00",
      "installments": null,
      "category": {
        "id": "uuid",
        "name": "Casa"
      },
      "paymentMethod": {
        "id": "uuid",
        "name": "Efectivo"
      },
      "recurringSeries": null,
      "createdAt": "2025-10-23T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 1159,
    "totalPages": 47
  },
  "summary": {
    "totalIncome": "4663900.00",
    "totalExpense": "9163900.00",
    "balance": "-4500000.00"
  }
}
```

---

#### GET /transactions/:id
Obtiene una transacción específica.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2025-10-23T00:00:00Z",
    "type": "EXPENSE",
    "description": "Metrogas coima",
    "amount": "10000.00",
    "installments": null,
    "category": { "id": "uuid", "name": "Casa" },
    "paymentMethod": { "id": "uuid", "name": "Efectivo" },
    "recurringSeries": null,
    "createdAt": "2025-10-23T12:00:00Z",
    "updatedAt": "2025-10-23T12:00:00Z"
  }
}
```

---

#### POST /transactions
Crea una nueva transacción.

**Request Body:**
```json
{
  "date": "2025-10-24",
  "type": "EXPENSE",
  "description": "Almuerzo oficina",
  "amount": 6000,
  "categoryId": "uuid",
  "paymentMethodId": "uuid",
  "installments": "1/12", // optional
  "seriesId": "uuid" // optional
}
```

**Validations:**
- `date`: valid ISO date, not future beyond today
- `type`: "INCOME" or "EXPENSE"
- `amount`: positive number
- `installments`: null or format "n1/n2" where n1 <= n2
- `categoryId`: must exist and belong to user
- `paymentMethodId`: must exist and belong to user
- `seriesId`: optional, must exist and belong to user

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2025-10-24T00:00:00Z",
    "type": "EXPENSE",
    "description": "Almuerzo oficina",
    "amount": "6000.00",
    "installments": "1/12",
    "categoryId": "uuid",
    "paymentMethodId": "uuid",
    "seriesId": "uuid",
    "createdAt": "2025-10-24T12:00:00Z"
  }
}
```

---

#### PUT /transactions/:id
Actualiza una transacción existente.

**Request Body:** Same as POST (all fields optional)

**Response 200:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

#### DELETE /transactions/:id
Elimina una transacción.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Transaction deleted successfully"
  }
}
```

---

### 4.8 Endpoints de Series Recurrentes

#### GET /recurring-series
Lista todas las series recurrentes del usuario.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Alquiler",
      "frequency": "MONTHLY",
      "transactionCount": 10,
      "lastTransaction": {
        "date": "2025-10-01T00:00:00Z",
        "amount": "350000.00"
      },
      "averageAmount": "350000.00",
      "totalAmount": "3500000.00",
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

---

#### POST /recurring-series
Crea una nueva serie recurrente.

**Request Body:**
```json
{
  "name": "Seguro Auto",
  "frequency": "ANNUAL"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Seguro Auto",
    "frequency": "ANNUAL",
    "createdAt": "2025-10-24T10:00:00Z"
  }
}
```

---

#### GET /recurring-series/:id/transactions
Obtiene todas las transacciones de una serie recurrente.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "series": {
      "id": "uuid",
      "name": "Alquiler"
    },
    "transactions": [
      {
        "id": "uuid",
        "date": "2025-10-01T00:00:00Z",
        "amount": "350000.00",
        "description": "Alquiler Octubre"
      },
      {
        "id": "uuid",
        "date": "2025-09-01T00:00:00Z",
        "amount": "350000.00",
        "description": "Alquiler Septiembre"
      }
    ],
    "summary": {
      "count": 10,
      "total": "3500000.00",
      "average": "350000.00"
    }
  }
}
```

---

#### PUT /recurring-series/:id
Actualiza una serie recurrente.

---

#### DELETE /recurring-series/:id
Elimina una serie (las transacciones quedan sin serie).

---

### 4.9 Endpoints de Importación

#### POST /import/csv
Importa transacciones desde un archivo CSV.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: CSV file
- `filters` (optional): JSON string
  ```json
  {
    "dateFrom": "2025-01-01",
    "dateTo": "2025-10-31",
    "paymentMethodIds": ["uuid1", "uuid2"]
  }
  ```

**Proceso:**
1. Validar archivo CSV
2. Parsear registros
3. Aplicar filtros si existen
4. Devolver preview para confirmación del usuario

**Response 200:**
```json
{
  "success": true,
  "data": {
    "preview": [
      {
        "date": "2025-10-23",
        "type": "EXPENSE",
        "category": "Casa",
        "description": "Metrogas coima",
        "amount": 10000,
        "detectedPaymentMethod": "Efectivo",
        "detectedInstallments": null
      }
    ],
    "summary": {
      "totalRecords": 1159,
      "filteredRecords": 250,
      "willImport": 250
    },
    "warnings": [
      "15 records without detected payment method"
    ]
  }
}
```

---

#### POST /import/csv/confirm
Confirma y ejecuta la importación de CSV.

**Request Body:**
```json
{
  "previewData": [ ... ], // data from preview
  "createMissingCategories": true,
  "defaultPaymentMethodId": "uuid" // for records without detected method
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "imported": 250,
    "failed": 0,
    "newCategoriesCreated": 5,
    "errors": []
  }
}
```

---

#### POST /import/pdf
Importa transacciones desde un PDF de resumen de tarjeta.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: PDF file
- `paymentMethodId`: UUID of payment method to associate

**Response 200:**
```json
{
  "success": true,
  "data": {
    "bankDetected": "Santander",
    "period": "Septiembre 2025",
    "preview": [
      {
        "date": "2025-09-15",
        "description": "SHELL AVELLANEDA",
        "amount": 67000,
        "installments": null
      }
    ],
    "summary": {
      "totalTransactions": 45,
      "totalAmount": 850000
    },
    "warnings": [
      "Some descriptions may need manual review"
    ]
  }
}
```

---

#### POST /import/pdf/confirm
Confirma y ejecuta la importación de PDF.

**Request Body:**
```json
{
  "previewData": [ ... ],
  "paymentMethodId": "uuid",
  "categoryMappings": {
    "SHELL": "uuid-categoria-coche",
    "NETFLIX": "uuid-categoria-servicios"
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "imported": 45,
    "failed": 0,
    "errors": []
  }
}
```

---

### 4.10 Endpoint de Cuotas Pendientes

#### GET /installments/pending
Lista todas las transacciones con cuotas pendientes.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "description": "Claude visa s",
      "paymentMethod": "Visa Santander",
      "installments": "1/6",
      "currentInstallment": 1,
      "totalInstallments": 6,
      "pendingInstallments": 5,
      "amountPerInstallment": "5000.00",
      "totalPending": "25000.00",
      "originalDate": "2025-10-01T00:00:00Z",
      "estimatedEndDate": "2026-03-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "description": "Calefon amex g",
      "paymentMethod": "Amex Gold",
      "installments": "3/12",
      "currentInstallment": 3,
      "totalInstallments": 12,
      "pendingInstallments": 9,
      "amountPerInstallment": "25000.00",
      "totalPending": "225000.00",
      "originalDate": "2025-08-01T00:00:00Z",
      "estimatedEndDate": "2026-08-01T00:00:00Z"
    }
  ],
  "summary": {
    "totalTransactionsWithInstallments": 15,
    "totalPendingAmount": "850000.00"
  }
}
```

**Business Logic:**
- Parse `installments` field (format "n1/n2")
- Calculate: `pendingInstallments = n2 - n1`
- Calculate: `amountPerInstallment = amount / n2`
- Calculate: `totalPending = pendingInstallments * amountPerInstallment`
- Calculate: `estimatedEndDate = originalDate + (n2 months)`

---

## 5. Arquitectura del Backend

### 5.1 Estructura de Directorios

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts         # Prisma client configuration
│   │   └── env.ts              # Environment variables validation
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication middleware
│   │   ├── errorHandler.ts    # Global error handler
│   │   └── validation.ts       # Request validation middleware
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.schema.ts  # Zod validation schemas
│   │   ├── payment-methods/
│   │   │   ├── payment-method.controller.ts
│   │   │   ├── payment-method.service.ts
│   │   │   ├── payment-method.routes.ts
│   │   │   └── payment-method.schema.ts
│   │   ├── categories/
│   │   │   └── ...
│   │   ├── transactions/
│   │   │   └── ...
│   │   ├── recurring-series/
│   │   │   └── ...
│   │   └── import/
│   │       ├── import.controller.ts
│   │       ├── import.service.ts
│   │       ├── csv-parser.service.ts
│   │       ├── pdf-parser.service.ts
│   │       └── import.routes.ts
│   ├── utils/
│   │   ├── logger.ts           # Logging utility
│   │   ├── response.ts         # Standard response formatter
│   │   └── date.ts             # Date utilities
│   ├── types/
│   │   └── express.d.ts        # Express type extensions
│   ├── app.ts                  # Express app configuration
│   └── server.ts               # Server entry point
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                 # Database seeding
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── package.json
└── README.md
```

### 5.2 Patrones de Diseño

#### Controller-Service Pattern

**Controller:** Maneja HTTP requests/responses
```typescript
// payment-method.controller.ts
export class PaymentMethodController {
  constructor(private paymentMethodService: PaymentMethodService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const paymentMethods = await this.paymentMethodService.findAll(userId);
      return res.json(successResponse(paymentMethods));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = createPaymentMethodSchema.parse(req.body);
      const paymentMethod = await this.paymentMethodService.create(userId, data);
      return res.status(201).json(successResponse(paymentMethod));
    } catch (error) {
      next(error);
    }
  }
}
```

**Service:** Contiene la lógica de negocio
```typescript
// payment-method.service.ts
export class PaymentMethodService {
  constructor(private prisma: PrismaClient) {}

  async findAll(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
  }

  async create(userId: string, data: CreatePaymentMethodDto) {
    // Check for duplicate name
    const existing = await this.prisma.paymentMethod.findUnique({
      where: {
        userId_name: {
          userId,
          name: data.name
        }
      }
    });

    if (existing) {
      throw new ConflictError('Payment method with this name already exists');
    }

    return this.prisma.paymentMethod.create({
      data: {
        userId,
        name: data.name
      }
    });
  }

  async delete(userId: string, id: string) {
    // Check if payment method exists and belongs to user
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id, userId }
    });

    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }

    // Try to delete (will throw if constraint fails)
    try {
      await this.prisma.paymentMethod.delete({
        where: { id }
      });
    } catch (error) {
      if (error.code === 'P2003') { // Foreign key constraint
        throw new ConflictError(
          'Cannot delete payment method with associated transactions'
        );
      }
      throw error;
    }
  }
}
```

#### Repository Pattern (Optional)

Si se desea mayor abstracción de Prisma:
```typescript
// payment-method.repository.ts
export class PaymentMethodRepository {
  constructor(private prisma: PrismaClient) {}

  findAll(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
  }

  findByName(userId: string, name: string) {
    return this.prisma.paymentMethod.findUnique({
      where: { userId_name: { userId, name } }
    });
  }

  create(data: Prisma.PaymentMethodCreateInput) {
    return this.prisma.paymentMethod.create({ data });
  }

  // ... more methods
}
```

### 5.3 Autenticación y Autorización

#### JWT Configuration
```typescript
// config/jwt.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  expiresIn: '7d',
  algorithm: 'HS256' as const
};

export function generateToken(payload: { userId: string }) {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: jwtConfig.algorithm
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, jwtConfig.secret) as { userId: string };
}
```

#### Auth Middleware
```typescript
// middleware/auth.ts
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    // Attach user to request
    req.user = { id: payload.userId };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
}
```

#### Password Hashing
```typescript
// auth/auth.service.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 5.4 Validación con Zod

```typescript
// auth/auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
```

```typescript
// transactions/transaction.schema.ts
export const createTransactionSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  }),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1).max(500),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().uuid(),
  paymentMethodId: z.string().uuid(),
  installments: z
    .string()
    .regex(/^\d+\/\d+$/, 'Installments must be in format n1/n2')
    .refine((val) => {
      const [current, total] = val.split('/').map(Number);
      return current <= total;
    }, 'Current installment cannot exceed total')
    .nullable()
    .optional(),
  seriesId: z.string().uuid().nullable().optional()
});
```

### 5.5 Error Handling

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: any[]) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

```typescript
// middleware/errorHandler.ts
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        ...(error instanceof ValidationError && { details: error.details })
      }
    });
  }

  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      }
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
}
```

### 5.6 CSV Parsing Service

```typescript
// import/csv-parser.service.ts
import Papa from 'papaparse';
import { z } from 'zod';

const csvRowSchema = z.object({
  Fecha: z.string(),
  'Ingresos/Gastos': z.string(),
  'Categoría': z.string(),
  'Memorándum': z.string(),
  Importe: z.string()
});

export class CsvParserService {
  async parse(fileBuffer: Buffer): Promise<ParsedCsvRow[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(fileBuffer.toString('utf-8'), {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const parsed = results.data.map((row: any, index: number) => {
              // Validate row schema
              const validatedRow = csvRowSchema.parse(row);
              
              return {
                date: new Date(validatedRow.Fecha),
                type: validatedRow['Ingresos/Gastos'] === 'Ingresos' 
                  ? 'INCOME' 
                  : 'EXPENSE',
                category: validatedRow['Categoría'],
                description: validatedRow['Memorándum'],
                amount: Math.abs(parseFloat(validatedRow.Importe)),
                detectedPaymentMethod: this.detectPaymentMethod(
                  validatedRow['Memorándum']
                ),
                detectedInstallments: this.detectInstallments(
                  validatedRow['Memorándum']
                )
              };
            });
            
            resolve(parsed);
          } catch (error) {
            reject(new ValidationError('Invalid CSV format'));
          }
        },
        error: (error) => {
          reject(new ValidationError(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  private detectPaymentMethod(memo: string): string | null {
    const patterns: Record<string, string> = {
      'visa s': 'Visa Santander',
      'visa g': 'Visa Galicia',
      'amex s': 'Amex Santander',
      'amex g': 'Amex Gold'
    };

    const memoLower = memo.toLowerCase();
    for (const [pattern, method] of Object.entries(patterns)) {
      if (memoLower.includes(pattern)) {
        return method;
      }
    }

    return null;
  }

  private detectInstallments(memo: string): string | null {
    const installmentRegex = /(\d+)\/(\d+)/;
    const match = memo.match(installmentRegex);
    
    if (match) {
      const [_, current, total] = match;
      if (parseInt(current) <= parseInt(total)) {
        return `${current}/${total}`;
      }
    }

    return null;
  }

  applyFilters(
    rows: ParsedCsvRow[],
    filters: CsvFilters
  ): ParsedCsvRow[] {
    let filtered = rows;

    if (filters.dateFrom) {
      filtered = filtered.filter(row => row.date >= new Date(filters.dateFrom!));
    }

    if (filters.dateTo) {
      filtered = filtered.filter(row => row.date <= new Date(filters.dateTo!));
    }

    if (filters.paymentMethodIds && filters.paymentMethodIds.length > 0) {
      // This requires matching detected methods with actual payment method IDs
      // Implementation depends on how you want to handle this mapping
    }

    return filtered;
  }
}
```

### 5.7 PDF Parsing Service

```typescript
// import/pdf-parser.service.ts
import pdf from 'pdf-parse';

export class PdfParserService {
  async parse(fileBuffer: Buffer): Promise<ParsedPdfData> {
    try {
      const data = await pdf(fileBuffer);
      
      // Detect bank from content patterns
      const bank = this.detectBank(data.text);
      
      if (!bank) {
        throw new ValidationError('Unable to detect bank from PDF');
      }

      // Parse based on detected bank
      const transactions = this.parseByBank(bank, data.text);
      
      return {
        bank,
        transactions,
        rawText: data.text
      };
    } catch (error) {
      throw new ValidationError('Failed to parse PDF');
    }
  }

  private detectBank(text: string): string | null {
    if (text.includes('Banco Santander')) return 'SANTANDER';
    if (text.includes('Banco Galicia')) return 'GALICIA';
    if (text.includes('American Express')) return 'AMEX';
    
    return null;
  }

  private parseByBank(bank: string, text: string): PdfTransaction[] {
    switch (bank) {
      case 'SANTANDER':
        return this.parseSantander(text);
      case 'GALICIA':
        return this.parseGalicia(text);
      case 'AMEX':
        return this.parseAmex(text);
      default:
        return [];
    }
  }

  private parseSantander(text: string): PdfTransaction[] {
    // Implement Santander-specific parsing logic
    // This will need to be customized based on actual PDF format
    const transactions: PdfTransaction[] = [];
    
    // Example regex pattern (needs to match actual format)
    const pattern = /(\d{2}\/\d{2})\s+(.+?)\s+(\d+[.,]\d{2})/g;
    
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const [_, date, description, amount] = match;
      
      transactions.push({
        date: this.parseDate(date),
        description: description.trim(),
        amount: this.parseAmount(amount),
        installments: this.detectInstallmentsInDescription(description)
      });
    }
    
    return transactions;
  }

  private parseGalicia(text: string): PdfTransaction[] {
    // TODO: Implement when Galicia PDF format is available
    return [];
  }

  private parseAmex(text: string): PdfTransaction[] {
    // TODO: Implement when Amex PDF format is available
    return [];
  }

  private parseDate(dateStr: string): Date {
    // Parse DD/MM format and add current year
    const [day, month] = dateStr.split('/').map(Number);
    const currentYear = new Date().getFullYear();
    return new Date(currentYear, month - 1, day);
  }

  private parseAmount(amountStr: string): number {
    return parseFloat(amountStr.replace(',', '.'));
  }

  private detectInstallmentsInDescription(desc: string): string | null {
    const patterns = [
      /cuota\s+(\d+)\s+de\s+(\d+)/i,
      /(\d+)\/(\d+)/
    ];

    for (const pattern of patterns) {
      const match = desc.match(pattern);
      if (match) {
        return `${match[1]}/${match[2]}`;
      }
    }

    return null;
  }
}
```

---

## 6. Arquitectura del Frontend

### 6.1 Estructura de Directorios

```
frontend/
├── public/
│   └── assets/
├── src/
│   ├── api/
│   │   ├── client.ts           # Axios instance configuration
│   │   ├── auth.api.ts
│   │   ├── transactions.api.ts
│   │   ├── categories.api.ts
│   │   └── ...
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── transactions/
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── TransactionFilters.tsx
│   │   │   └── ...
│   │   ├── import/
│   │   │   ├── CsvImport.tsx
│   │   │   ├── PdfImport.tsx
│   │   │   └── ImportPreview.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTransactions.ts
│   │   ├── useCategories.ts
│   │   └── ...
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Categories.tsx
│   │   ├── PaymentMethods.tsx
│   │   ├── RecurringSeries.tsx
│   │   ├── PendingInstallments.tsx
│   │   └── Import.tsx
│   ├── store/
│   │   ├── authStore.ts         # Zustand store for auth
│   │   └── ...
│   ├── types/
│   │   ├── transaction.types.ts
│   │   ├── category.types.ts
│   │   └── ...
│   ├── utils/
│   │   ├── formatters.ts        # Currency, date formatters
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
├── .env.example
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

### 6.2 Routing

```typescript
// routes.tsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'transactions',
        element: <Transactions />
      },
      {
        path: 'categories',
        element: <Categories />
      },
      {
        path: 'payment-methods',
        element: <PaymentMethods />
      },
      {
        path: 'recurring-series',
        element: <RecurringSeries />
      },
      {
        path: 'pending-installments',
        element: <PendingInstallments />
      },
      {
        path: 'import',
        element: <Import />
      }
    ]
  }
]);
```

### 6.3 State Management con Zustand

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      login: (token, user) => 
        set({ token, user, isAuthenticated: true }),
      
      logout: () => 
        set({ token: null, user: null, isAuthenticated: false })
    }),
    {
      name: 'auth-storage'
    }
  )
);
```

### 6.4 API Client Configuration

```typescript
// api/client.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
```

### 6.5 Custom Hooks

```typescript
// hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as transactionsApi from '../api/transactions.api';

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsApi.getTransactions(filters)
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: transactionsApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: transactionsApi.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });
}
```

### 6.6 Form Handling con React Hook Form

```typescript
// components/transactions/TransactionForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const transactionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().uuid('Category is required'),
  paymentMethodId: z.string().uuid('Payment method is required'),
  installments: z.string().regex(/^\d+\/\d+$/).nullable().optional(),
  seriesId: z.string().uuid().nullable().optional()
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export function TransactionForm({ onSubmit, initialData }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Date"
        type="date"
        {...register('date')}
        error={errors.date?.message}
      />
      
      <Select
        label="Type"
        {...register('type')}
        options={[
          { value: 'EXPENSE', label: 'Expense' },
          { value: 'INCOME', label: 'Income' }
        ]}
        error={errors.type?.message}
      />
      
      <Input
        label="Description"
        {...register('description')}
        error={errors.description?.message}
      />
      
      <Input
        label="Amount"
        type="number"
        step="0.01"
        {...register('amount', { valueAsNumber: true })}
        error={errors.amount?.message}
      />
      
      {/* Category, Payment Method, etc. */}
      
      <Button type="submit">Save</Button>
    </form>
  );
}
```

### 6.7 Responsive Design Breakpoints

```typescript
// utils/constants.ts
export const breakpoints = {
  mobile: 375,
  tablet: 768,
  desktop: 1920
};

// If using TailwindCSS, configure in tailwind.config.ts
export default {
  theme: {
    screens: {
      'sm': '375px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1920px'
    }
  }
};
```

---

## 7. Seguridad

### 7.1 Checklist de Seguridad

#### Backend
- [ ] Passwords hasheadas con bcrypt (salt rounds >= 10)
- [ ] JWT tokens con expiración (7 días)
- [ ] JWT secret fuerte y en variable de entorno
- [ ] HTTPS obligatorio en producción
- [ ] CORS configurado correctamente
- [ ] Rate limiting en endpoints de auth (5 intentos / 15 min)
- [ ] Validación de entrada en todos los endpoints (Zod)
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (React escapa por defecto)
- [ ] Logs de errores sin información sensible
- [ ] Headers de seguridad (helmet.js)

#### Frontend
- [ ] Token almacenado en localStorage con caducidad
- [ ] Logout automático al expirar token
- [ ] HTTPS en producción
- [ ] Validación de formularios antes de enviar
- [ ] No exponer información sensible en console.log
- [ ] CSP (Content Security Policy) headers

### 7.2 Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/financedb
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 8. Testing

### 8.1 Estrategia de Testing

#### Backend
- **Unit Tests:** Servicios, utilidades, helpers
- **Integration Tests:** Endpoints de API completos
- **E2E Tests:** Flujos críticos (registro, login, importación CSV)

#### Frontend
- **Unit Tests:** Componentes aislados, hooks, utilidades
- **Integration Tests:** Formularios completos, flujos de usuario
- **E2E Tests:** Cypress para flujos críticos

### 8.2 Ejemplo de Test Unitario (Backend)

```typescript
// __tests__/services/payment-method.service.test.ts
import { PaymentMethodService } from '../../src/modules/payment-methods/payment-method.service';
import { prismaMock } from '../setup';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;

  beforeEach(() => {
    service = new PaymentMethodService(prismaMock);
  });

  describe('create', () => {
    it('should create a payment method successfully', async () => {
      const userId = 'user-123';
      const data = { name: 'Visa Santander' };

      prismaMock.paymentMethod.findUnique.mockResolvedValue(null);
      prismaMock.paymentMethod.create.mockResolvedValue({
        id: 'pm-123',
        userId,
        name: data.name,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await service.create(userId, data);

      expect(result.name).toBe(data.name);
      expect(prismaMock.paymentMethod.create).toHaveBeenCalledWith({
        data: { userId, name: data.name }
      });
    });

    it('should throw ConflictError if name already exists', async () => {
      const userId = 'user-123';
      const data = { name: 'Visa Santander' };

      prismaMock.paymentMethod.findUnique.mockResolvedValue({
        id: 'pm-existing',
        userId,
        name: data.name,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await expect(service.create(userId, data)).rejects.toThrow(ConflictError);
    });
  });
});
```

### 8.3 Ejemplo de Test de Integración (Backend)

```typescript
// __tests__/integration/auth.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });
    });

    it('should login successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
```

---

## 9. Deployment

### 9.1 Docker Configuration

#### docker-compose.yml (Development)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    container_name: finance-db
    environment:
      POSTGRES_USER: finance_user
      POSTGRES_PASSWORD: finance_pass
      POSTGRES_DB: financedb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: finance-backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://finance_user:finance_pass@postgres:5432/financedb
      JWT_SECRET: dev-secret-change-in-production
      NODE_ENV: development
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: finance-frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
```

#### Backend Dockerfile
```dockerfile
# Dockerfile (production)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
# Dockerfile (production)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 9.2 Production Deployment Checklist

#### Backend
- [ ] Environment variables configuradas correctamente
- [ ] DATABASE_URL apunta a base de datos de producción
- [ ] JWT_SECRET fuerte y único
- [ ] NODE_ENV=production
- [ ] CORS configurado con dominios permitidos
- [ ] Rate limiting habilitado
- [ ] Logging configurado (ej: Winston + CloudWatch)
- [ ] Health check endpoint (/health)
- [ ] Prisma migrations ejecutadas
- [ ] SSL/TLS certificates configurados

#### Frontend
- [ ] VITE_API_URL apunta a backend de producción
- [ ] Build optimizado (npm run build)
- [ ] Assets servidos con CDN (opcional)
- [ ] Service Worker para PWA (opcional)
- [ ] Error tracking (ej: Sentry)
- [ ] Analytics (ej: Google Analytics)

#### Database
- [ ] Backups automáticos configurados
- [ ] Connection pooling configurado
- [ ] Índices creados y optimizados
- [ ] Monitoring configurado

---

## 10. Métricas y Monitoring

### 10.1 Health Check Endpoint

```typescript
// backend/src/routes/health.ts
export const healthRouter = express.Router();

healthRouter.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});
```

### 10.2 Logging

```typescript
// utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## 11. Performance Optimization

### 11.1 Database Optimization

#### Query Optimization
```typescript
// Bad: N+1 queries
const transactions = await prisma.transaction.findMany();
for (const t of transactions) {
  const category = await prisma.category.findUnique({ where: { id: t.categoryId } });
}

// Good: Single query with includes
const transactions = await prisma.transaction.findMany({
  include: {
    category: true,
    paymentMethod: true
  }
});
```

#### Pagination
```typescript
// Always use pagination for large datasets
const transactions = await prisma.transaction.findMany({
  where: { userId },
  take: limit,
  skip: (page - 1) * limit,
  orderBy: { date: 'desc' }
});
```

### 11.2 Frontend Optimization

#### Code Splitting
```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));

// Wrap in Suspense
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/transactions" element={<Transactions />} />
  </Routes>
</Suspense>
```

#### Memoization
```typescript
// Memoize expensive calculations
const sortedTransactions = useMemo(() => {
  return transactions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}, [transactions]);

// Memoize callbacks
const handleDelete = useCallback((id: string) => {
  deleteTransaction(id);
}, [deleteTransaction]);
```

---

## 12. Roadmap y Mejoras Futuras

### Phase 2 (Post-MVP)
- [ ] Dashboard con estadísticas y gráficos
- [ ] Exportación de datos (CSV, PDF, Excel)
- [ ] Presupuestos mensuales por categoría
- [ ] Alertas y notificaciones
- [ ] Gestión avanzada de tarjetas (límites, fechas)
- [ ] Multi-currency support
- [ ] Búsqueda full-text en transacciones
- [ ] Tags adicionales para transacciones
- [ ] Comentarios/notas en transacciones

### Phase 3
- [ ] Mobile apps (React Native)
- [ ] Integraciones bancarias automáticas
- [ ] OCR mejorado para tickets
- [ ] Machine learning para categorización automática
- [ ] Compartir gastos con otros usuarios
- [ ] Reportes personalizables
- [ ] API pública para integraciones

---

## 13. Anexos

### Anexo A: Comandos Útiles

#### Backend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Run migrations in production
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Build for production
npm run build

# Start production server
npm start
```

#### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

#### Docker
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose up --build

# Run migrations in container
docker-compose exec backend npx prisma migrate deploy
```

### Anexo B: Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/transaction-crud
# ... make changes ...
git add .
git commit -m "feat: add transaction CRUD endpoints"
git push origin feature/transaction-crud
# ... create PR on GitHub ...

# Commit message conventions (Conventional Commits)
feat: new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

---

**FIN DE LA ESPECIFICACIÓN TÉCNICA**
