# Especificación Funcional - Sistema de Gestión de Gastos Personales

## 1. Información del Documento

**Versión:** 1.0  
**Fecha:** 24 de Octubre de 2025  
**Autor:** Analista Funcional Sr.  
**Proyecto:** Personal Finance Manager - MVP  

---

## 2. Objetivo del Sistema

Desarrollar una aplicación web que permita a usuarios gestionar sus finanzas personales mediante el registro, categorización y análisis de gastos e ingresos. El sistema facilitará la importación de datos desde múltiples fuentes (CSV, PDF de resúmenes bancarios) y proporcionará herramientas de filtrado y visualización para un mejor control financiero.

---

## 3. Alcance del MVP

### 3.1 Funcionalidades Incluidas

- Autenticación y gestión de usuarios (multiusuario)
- Importación de gastos mediante CSV con filtrado previo
- ABM de gastos con interfaz manual
- Lectura automática de PDFs de resúmenes de tarjetas de crédito
- Gestión de categorías y macrocategorías
- Gestión de métodos de pago
- Definición y vinculación de gastos fijos recurrentes
- Visualización de cuotas pendientes
- Filtros avanzados por fecha, categoría y método de pago
- Diseño responsive (mobile-first)

### 3.2 Funcionalidades Excluidas del MVP

- Gestión avanzada de tarjetas (límites, fechas de cierre, vencimientos)
- Estadísticas y gráficos detallados
- Integraciones con APIs bancarias
- Exportación de datos
- Presupuestos y alertas
- Notificaciones

---

## 4. Actores del Sistema

### 4.1 Usuario Registrado
Persona que utiliza el sistema para gestionar sus finanzas personales. Puede crear, editar, eliminar y consultar gastos, configurar categorías y métodos de pago.

---

## 5. Casos de Uso

### 5.1 Gestión de Usuarios

#### CU-01: Registro de Usuario
**Actor:** Usuario no registrado  
**Precondiciones:** Ninguna  
**Flujo Principal:**
1. El usuario accede a la pantalla de registro
2. El sistema solicita: email y contraseña
3. El usuario ingresa los datos
4. El sistema valida:
   - Email con formato válido
   - Contraseña con mínimo 8 caracteres
   - Email no registrado previamente
5. El sistema crea la cuenta y envía confirmación
6. El usuario es redirigido al login

**Flujo Alternativo:**
- 4a. Email ya registrado: El sistema informa y sugiere recuperación de contraseña
- 4b. Datos inválidos: El sistema muestra mensajes de error específicos

#### CU-02: Login de Usuario
**Actor:** Usuario registrado  
**Precondiciones:** Usuario con cuenta activa  
**Flujo Principal:**
1. El usuario accede a la pantalla de login
2. El sistema solicita email y contraseña
3. El usuario ingresa credenciales
4. El sistema valida las credenciales
5. El sistema genera token de sesión
6. El usuario accede al dashboard principal

**Flujo Alternativo:**
- 4a. Credenciales inválidas: El sistema muestra error y permite reintentar
- 4b. Cuenta bloqueada: El sistema informa y sugiere recuperación

#### CU-03: Logout de Usuario
**Actor:** Usuario registrado  
**Precondiciones:** Usuario con sesión activa  
**Flujo Principal:**
1. El usuario selecciona opción de cerrar sesión
2. El sistema invalida el token de sesión
3. El usuario es redirigido al login

---

### 5.2 Gestión de Métodos de Pago

#### CU-04: Crear Método de Pago
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. El usuario accede al ABM de métodos de pago
2. El usuario selecciona "Nuevo método de pago"
3. El sistema solicita: nombre del método (ej: "Visa Santander", "Efectivo", "Débito BBVA")
4. El usuario ingresa los datos
5. El sistema valida que el nombre no esté duplicado para ese usuario
6. El sistema guarda el método de pago
7. El sistema muestra confirmación y actualiza el listado

**Flujo Alternativo:**
- 5a. Nombre duplicado: El sistema informa y solicita otro nombre
- 5b. Campo vacío: El sistema muestra error de validación

#### CU-05: Listar Métodos de Pago
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. El usuario accede al ABM de métodos de pago
2. El sistema muestra listado con: ID, nombre, fecha de creación
3. El sistema permite ordenar alfabéticamente
4. El usuario puede seleccionar un método para editar o eliminar

#### CU-06: Editar Método de Pago
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado, método existente  
**Flujo Principal:**
1. El usuario selecciona un método del listado
2. El sistema muestra formulario pre-cargado
3. El usuario modifica el nombre
4. El sistema valida unicidad del nombre
5. El sistema actualiza el registro
6. El sistema muestra confirmación

**Flujo Alternativo:**
- 4a. Nombre duplicado: El sistema rechaza y solicita otro nombre
- 5a. Método asociado a gastos: El sistema actualiza y propaga el cambio

#### CU-07: Eliminar Método de Pago
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado, método existente  
**Flujo Principal:**
1. El usuario selecciona eliminar un método
2. El sistema verifica si hay gastos asociados
3. El sistema solicita confirmación
4. El usuario confirma
5. El sistema elimina el método
6. El sistema muestra confirmación

**Flujo Alternativo:**
- 2a. Hay gastos asociados: El sistema informa y pregunta si desea desvincular o cancelar
- 2b. Usuario cancela: El sistema no elimina y vuelve al listado

---

### 5.3 Gestión de Categorías

#### CU-08: Crear Categoría
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. El usuario accede al ABM de categorías
2. El usuario selecciona "Nueva categoría"
3. El sistema solicita:
   - Nombre de categoría (ej: "Comida", "Transporte")
   - Macrocategoría asociada (opcional, desplegable)
4. El usuario ingresa los datos
5. El sistema valida unicidad del nombre
6. El sistema guarda la categoría
7. El sistema muestra confirmación y actualiza el listado

**Flujo Alternativo:**
- 5a. Nombre duplicado: El sistema rechaza y solicita otro nombre
- 3a. Usuario quiere crear nueva macrocategoría: El sistema abre modal para crearla

#### CU-09: Crear Macrocategoría
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. Desde el formulario de categorías, el usuario selecciona "Nueva macrocategoría"
2. El sistema solicita: nombre de macrocategoría (ej: "Alimentación", "Hogar")
3. El usuario ingresa el nombre
4. El sistema valida unicidad
5. El sistema guarda la macrocategoría
6. El sistema actualiza el desplegable de macrocategorías

**Flujo Alternativo:**
- 4a. Nombre duplicado: El sistema rechaza y solicita otro

#### CU-10: Listar Categorías
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. El usuario accede al ABM de categorías
2. El sistema muestra listado con: ID, nombre, macrocategoría, cantidad de gastos asociados
3. El sistema permite filtrar por macrocategoría
4. El sistema permite ordenar alfabéticamente
5. El usuario puede seleccionar una categoría para editar o eliminar

#### CU-11: Editar Categoría
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado, categoría existente  
**Flujo Principal:**
1. El usuario selecciona una categoría del listado
2. El sistema muestra formulario pre-cargado
3. El usuario modifica nombre y/o macrocategoría
4. El sistema valida unicidad del nombre
5. El sistema actualiza el registro
6. El sistema muestra confirmación

#### CU-12: Eliminar Categoría
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado, categoría existente  
**Flujo Principal:**
1. El usuario selecciona eliminar una categoría
2. El sistema verifica si hay gastos asociados
3. El sistema solicita confirmación mostrando cantidad de gastos afectados
4. El usuario confirma
5. El sistema elimina la categoría
6. El sistema muestra confirmación

**Flujo Alternativo:**
- 2a. Hay gastos asociados: El sistema informa y permite reasignar o desvincular
- 4a. Usuario cancela: El sistema no elimina

---

### 5.4 Gestión de Gastos e Ingresos

#### CU-13: Crear Gasto/Ingreso Manual
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. El usuario accede al formulario de nuevo gasto/ingreso
2. El sistema solicita:
   - Tipo (Gasto/Ingreso) - radio button
   - Fecha (date picker, default: hoy)
   - Descripción/Memorándum (text)
   - Importe (number, positivo)
   - Categoría (desplegable)
   - Método de pago (desplegable)
   - Cuotas (opcional): formato "cuota_actual/total_cuotas" (ej: "1/12")
   - Es recurrente (checkbox)
3. El usuario completa los campos
4. El sistema valida:
   - Fecha válida (no futura más allá de hoy)
   - Importe > 0
   - Categoría seleccionada
   - Método de pago seleccionado
   - Si hay cuotas, formato válido (n1/n2, n1 <= n2)
5. El sistema guarda el registro
6. Si es recurrente, el sistema solicita nombre de la serie recurrente
7. El sistema muestra confirmación

**Flujo Alternativo:**
- 4a. Validación falla: El sistema muestra errores específicos
- 6a. Usuario define gasto recurrente: El sistema crea vínculo de recurrencia

#### CU-14: Editar Gasto/Ingreso
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado, registro existente  
**Flujo Principal:**
1. El usuario selecciona un gasto/ingreso del listado
2. El sistema muestra formulario pre-cargado con todos los campos
3. El usuario modifica los campos deseados
4. El sistema valida los cambios
5. El sistema actualiza el registro
6. El sistema muestra confirmación

**Flujo Alternativo:**
- 3a. Usuario modifica gasto recurrente: El sistema pregunta si aplica solo a este o a toda la serie
- 4a. Validación falla: El sistema muestra errores

#### CU-15: Eliminar Gasto/Ingreso
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado, registro existente  
**Flujo Principal:**
1. El usuario selecciona eliminar un registro
2. Si es parte de serie recurrente, el sistema pregunta: solo este o toda la serie
3. El sistema solicita confirmación
4. El usuario confirma
5. El sistema elimina el/los registro(s)
6. El sistema muestra confirmación

#### CU-16: Listar Gastos/Ingresos
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. El usuario accede al listado de transacciones
2. El sistema muestra tabla con:
   - Fecha
   - Tipo (Ingreso/Gasto)
   - Descripción
   - Categoría
   - Método de pago
   - Importe
   - Cuotas (si aplica)
   - Acciones (editar/eliminar)
3. El sistema aplica ordenamiento por fecha descendente (más reciente primero)
4. El sistema implementa paginación (25 registros por página)

**Funcionalidades Adicionales:**
- Indicador visual de cuotas pendientes
- Badge para gastos recurrentes
- Suma total visible en footer de tabla

---

### 5.5 Importación de Datos

#### CU-17: Importar Gastos desde CSV
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado, archivo CSV con formato válido  
**Flujo Principal:**
1. El usuario accede a "Importar desde CSV"
2. El sistema muestra área de carga de archivo
3. El usuario selecciona archivo CSV
4. El sistema valida:
   - Formato CSV
   - Columnas requeridas: Fecha, Ingresos/Gastos, Categoría, Memorándum, Importe
   - Encoding UTF-8 con BOM
5. El sistema parsea el archivo y muestra vista previa con todos los registros
6. El sistema muestra controles de filtrado:
   - **Rango de fechas**: Date picker desde/hasta
   - **Métodos de pago**: Checkboxes múltiples
7. El usuario aplica filtros deseados
8. El sistema actualiza vista previa con registros filtrados
9. El sistema muestra contador: "X registros serán importados de Y totales"
10. El usuario confirma importación
11. El sistema procesa cada registro:
    - Convierte "Ingresos/Gastos" a tipo de transacción
    - Detecta cuotas en Memorándum (patrón n1/n2)
    - Busca/crea categorías automáticamente
    - Extrae método de pago del Memorándum si está presente (ej: "visa s", "amex g")
    - Si no detecta método de pago, marca como "Sin especificar"
12. El sistema guarda registros filtrados
13. El sistema muestra resumen:
    - Registros importados exitosamente
    - Registros con warnings (método de pago no detectado)
    - Nuevas categorías creadas

**Flujo Alternativo:**
- 4a. Archivo inválido: El sistema rechaza y muestra error específico
- 4b. Columnas faltantes: El sistema informa qué columnas faltan
- 11a. Error en registro individual: El sistema registra error pero continúa con siguientes
- 13a. Muchos registros sin método de pago: El sistema sugiere crear métodos manualmente

**Reglas de Negocio:**
- Importes negativos se convierten a valores absolutos y se marca tipo según columna "Ingresos/Gastos"
- Categorías no existentes se crean automáticamente (sin macrocategoría)
- Filtros son inclusivos (Y lógico entre fechas y métodos)
- Si no se aplican filtros, se importan todos los registros

#### CU-18: Importar Gastos desde PDF
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado, PDF de resumen de tarjeta  
**Flujo Principal:**
1. El usuario accede a "Importar desde PDF"
2. El sistema muestra área de carga de archivo
3. El usuario selecciona archivo PDF
4. El sistema valida formato PDF
5. El sistema detecta tipo de resumen bancario (según patrones conocidos)
6. El sistema extrae información:
   - Período del resumen
   - Gastos con: fecha, descripción, importe
   - Cuotas: detecta formato "Cuota X de Y"
7. El sistema muestra vista previa de gastos detectados
8. El sistema solicita:
   - Método de pago a asociar (desplegable)
   - Confirmación de categorización automática o manual
9. El usuario revisa y puede editar registros antes de importar
10. El usuario confirma importación
11. El sistema guarda los registros
12. El sistema muestra resumen de importación

**Flujo Alternativo:**
- 4a. Archivo inválido: El sistema rechaza
- 5a. PDF no reconocido: El sistema informa que no puede procesar automáticamente
- 5b. OCR necesario: El sistema procesa con OCR y advierte posibles errores
- 9a. Usuario edita registros: El sistema permite modificar antes de guardar

**Nota:** Esta funcionalidad dependerá de los formatos de PDF proporcionados. Se implementará de manera iterativa según los bancos/tarjetas utilizados.

---

### 5.6 Gestión de Gastos Recurrentes

#### CU-19: Definir Gasto Recurrente
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. Al crear un gasto (CU-13), el usuario marca checkbox "Es recurrente"
2. El sistema solicita:
   - Nombre de la serie (ej: "Alquiler", "Seguro Auto")
   - Frecuencia esperada (informativo, no automatizado): Mensual/Anual
3. El usuario ingresa los datos
4. El sistema crea el gasto y lo marca como parte de la serie recurrente
5. El sistema muestra confirmación

**Flujo Alternativo:**
- 2a. Usuario cancela: El gasto se crea sin marca de recurrente

#### CU-20: Vincular Gastos a Serie Recurrente
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado, serie recurrente existente  
**Flujo Principal:**
1. El usuario crea o edita un gasto
2. El usuario selecciona "Vincular a serie recurrente"
3. El sistema muestra desplegable con series existentes
4. El usuario selecciona la serie
5. El sistema vincula el gasto a la serie
6. El sistema muestra confirmación

#### CU-21: Ver Histórico de Gastos Recurrentes
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado, serie recurrente existente  
**Flujo Principal:**
1. El usuario accede a "Gastos Recurrentes"
2. El sistema muestra listado de series con:
   - Nombre de serie
   - Cantidad de ocurrencias
   - Último pago (fecha y monto)
   - Próximo pago esperado (calculado por frecuencia)
3. El usuario selecciona una serie
4. El sistema muestra histórico completo ordenado por fecha
5. El sistema calcula y muestra:
   - Promedio de monto
   - Total acumulado
   - Evolución temporal (si disponible)

---

### 5.7 Consultas y Filtros

#### CU-22: Filtrar Gastos por Rango de Fechas
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. El usuario accede al listado de transacciones
2. El usuario selecciona filtro por fecha
3. El sistema muestra date pickers: fecha desde / fecha hasta
4. El usuario selecciona rango
5. El sistema aplica filtro y actualiza listado
6. El sistema muestra contador de resultados
7. El sistema actualiza suma total visible

**Flujo Alternativo:**
- 4a. Solo fecha desde: El sistema filtra desde esa fecha hasta hoy
- 4b. Solo fecha hasta: El sistema filtra desde el inicio hasta esa fecha
- 4c. Usuario limpia filtros: El sistema muestra todos los registros

#### CU-23: Filtrar Gastos por Categoría
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. El usuario accede al listado de transacciones
2. El usuario selecciona filtro por categoría
3. El sistema muestra:
   - Desplegable de macrocategorías (opcional)
   - Checkboxes de categorías
4. El usuario selecciona una o más categorías
5. El sistema aplica filtro con OR lógico (cualquier categoría seleccionada)
6. El sistema actualiza listado y contador

**Funcionalidades Adicionales:**
- Si se selecciona macrocategoría, se marcan automáticamente todas sus categorías hijas
- Opción "Seleccionar todas" / "Limpiar selección"

#### CU-24: Filtrar Gastos por Método de Pago
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. El usuario accede al listado de transacciones
2. El usuario selecciona filtro por método de pago
3. El sistema muestra checkboxes con todos los métodos de pago
4. El usuario selecciona uno o más métodos
5. El sistema aplica filtro con OR lógico
6. El sistema actualiza listado y contador

#### CU-25: Combinar Múltiples Filtros
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado  
**Flujo Principal:**
1. El usuario aplica múltiples filtros simultáneamente:
   - Rango de fechas
   - Categorías
   - Métodos de pago
2. El sistema aplica filtros con AND lógico entre tipos (fecha AND categoría AND método)
3. Dentro de cada tipo, se aplica OR (ej: categoría1 OR categoría2)
4. El sistema actualiza resultados en tiempo real
5. El sistema muestra chips/badges con filtros activos
6. El usuario puede remover filtros individuales haciendo clic en el chip

**Reglas de Negocio:**
- Filtros se mantienen activos durante la sesión
- Se puede guardar combinación de filtros como "Vista guardada" (futuro enhancement)

---

### 5.8 Visualización de Cuotas

#### CU-26: Ver Cuotas Pendientes
**Actor:** Usuario registrado  
**Precondiciones:** Usuario autenticado, gastos con cuotas registrados  
**Flujo Principal:**
1. El usuario accede a "Cuotas Pendientes"
2. El sistema identifica todos los gastos con cuotas (formato n1/n2 en campo cuotas)
3. El sistema calcula cuotas pendientes: total_cuotas - cuota_actual
4. El sistema muestra listado con:
   - Descripción del gasto original
   - Método de pago
   - Cuota actual / Total cuotas
   - Cuotas pendientes
   - Monto por cuota (calculado: importe_total / total_cuotas)
   - Total pendiente de pago (cuotas_pendientes * monto_cuota)
   - Fecha estimada finalización (calculada desde fecha del gasto)
5. El sistema permite ordenar por:
   - Cuotas pendientes (mayor a menor)
   - Monto total pendiente
   - Fecha de finalización
6. El sistema muestra resumen:
   - Total de gastos en cuotas
   - Suma de todos los montos pendientes

**Reglas de Negocio:**
- Solo se muestran gastos con cuotas donde cuota_actual < total_cuotas
- Si cuota_actual = total_cuotas, se considera finalizado (no se muestra)

---

## 6. Requisitos No Funcionales

### 6.1 Usabilidad
- Interfaz intuitiva siguiendo principios de Material Design o similar
- Diseño mobile-first responsive
- Tiempo de respuesta < 2 segundos para operaciones normales
- Mensajes de error claros y accionables
- Confirmación obligatoria para acciones destructivas (eliminar)

### 6.2 Seguridad
- Contraseñas hasheadas con bcrypt o Argon2
- Tokens JWT para autenticación con expiración
- HTTPS obligatorio en producción
- Validación de entrada en frontend y backend
- Protección contra SQL injection (uso de ORM)
- Rate limiting en endpoints de autenticación

### 6.3 Performance
- Listados paginados (máximo 25-50 registros por página)
- Índices en base de datos para consultas frecuentes
- Carga diferida (lazy loading) de imágenes y componentes

### 6.4 Compatibilidad
- Navegadores: Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- Responsive: Desktop (1920px), Tablet (768px), Mobile (375px)

### 6.5 Mantenibilidad
- Código modular y documentado
- Convenciones de nombres claras
- Tests unitarios para lógica crítica
- Logging de errores

---

## 7. Reglas de Negocio Generales

### RN-01: Manejo de Importes
- Los gastos siempre se almacenan como valores positivos con un flag de tipo (Gasto/Ingreso)
- La UI muestra gastos con signo negativo para claridad visual
- Los importes se manejan como números decimales (2 decimales)

### RN-02: Categorías
- Cada usuario tiene su propio conjunto de categorías
- Las categorías son obligatorias para cada gasto
- Una categoría puede tener 0 o 1 macrocategoría
- No se pueden eliminar categorías con gastos asociados sin confirmación

### RN-03: Métodos de Pago
- Cada usuario tiene su propio conjunto de métodos de pago
- Los métodos de pago son obligatorios para cada gasto
- Se permite un método "Sin especificar" por defecto para importaciones

### RN-04: Cuotas
- El formato de cuotas es "n1/n2" donde n1 <= n2 y ambos son enteros positivos
- Las cuotas se consideran finalizadas cuando n1 = n2
- El cálculo de monto por cuota es: importe_total / n2

### RN-05: Gastos Recurrentes
- Un gasto puede pertenecer a máximo una serie recurrente
- Los gastos recurrentes se crean manualmente cada ocurrencia
- El sistema no genera automáticamente gastos recurrentes

### RN-06: Importación CSV
- El delimitador debe ser coma (,)
- El encoding debe ser UTF-8 con BOM
- Columnas requeridas: Fecha, Ingresos/Gastos, Categoría, Memorándum, Importe
- Orden de columnas debe respetarse
- Primera fila es encabezado (se ignora)

### RN-07: Multiusuario
- Cada usuario solo puede ver y gestionar sus propios datos
- No hay compartición de datos entre usuarios en el MVP
- Las categorías y métodos de pago son específicos de cada usuario

---

## 8. Glosario

- **ABM**: Alta, Baja, Modificación
- **CSV**: Comma-Separated Values, formato de archivo de datos tabulares
- **Gasto**: Salida de dinero (transacción negativa)
- **Ingreso**: Entrada de dinero (transacción positiva)
- **Categoría**: Clasificación de primer nivel de una transacción (ej: Comida, Transporte)
- **Macrocategoría**: Agrupación de categorías (ej: Alimentación agrupa Comida, Desayuno, Almuerzo)
- **Método de Pago**: Medio utilizado para realizar una transacción (ej: Visa, Efectivo, Débito)
- **Cuotas**: División de un pago en múltiples períodos
- **Gasto Recurrente**: Gasto que se repite periódicamente (ej: Alquiler, Seguros)
- **Serie Recurrente**: Conjunto de gastos relacionados que representan el mismo concepto en diferentes períodos
- **MVP**: Minimum Viable Product, versión mínima funcional del producto

---

## 9. Mockups y Wireframes

### 9.1 Pantalla de Login
```
┌────────────────────────────────────┐
│                                    │
│         Personal Finance           │
│              Manager               │
│                                    │
│   ┌──────────────────────────┐   │
│   │ Email                    │   │
│   └──────────────────────────┘   │
│                                    │
│   ┌──────────────────────────┐   │
│   │ Contraseña               │   │
│   └──────────────────────────┘   │
│                                    │
│   [ Iniciar Sesión ]              │
│                                    │
│   ¿No tenés cuenta? Registrate    │
│                                    │
└────────────────────────────────────┘
```

### 9.2 Dashboard Principal
```
┌────────────────────────────────────────────────┐
│ ☰ Personal Finance         [@usuario]  [Salir]│
├────────────────────────────────────────────────┤
│                                                │
│  [+ Nuevo Gasto]  [Importar CSV]  [Importar PDF]
│                                                │
│  Filtros: [Fecha: ▼] [Categoría: ▼] [Método: ▼]│
│           Aplicados: [Casa ×] [Efectivo ×]     │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Fecha    Desc.    Cat.   Método   Monto │ │
│  ├──────────────────────────────────────────┤ │
│  │ 23/10  Metrogas  Casa   Efectivo -10000 │ │
│  │ 22/10  Partido   Deporte Efectivo -3000 │ │
│  │ 22/10  Pan x5    Desayuno Efectivo -1050│ │
│  │ ...                                      │ │
│  └──────────────────────────────────────────┘ │
│  Mostrando 1-25 de 1,159 | Total: -$4,500,000│
│  [< Anterior]  Página 1 de 47  [Siguiente >] │
│                                                │
└────────────────────────────────────────────────┘

Menú lateral:
- Dashboard
- Gastos/Ingresos
- Cuotas Pendientes
- Gastos Recurrentes
- Categorías
- Métodos de Pago
- Importar Datos
```

### 9.3 Formulario Nuevo Gasto
```
┌────────────────────────────────────┐
│ Nuevo Gasto / Ingreso              │
├────────────────────────────────────┤
│                                    │
│ Tipo: ◉ Gasto  ○ Ingreso          │
│                                    │
│ Fecha: [📅 24/10/2025]            │
│                                    │
│ Descripción:                       │
│ ┌────────────────────────────────┐│
│ │ Almuerzo oficina               ││
│ └────────────────────────────────┘│
│                                    │
│ Importe: [$        ]               │
│                                    │
│ Categoría: [Almuerzo        ▼]    │
│                                    │
│ Método de pago: [Visa Santander ▼]│
│                                    │
│ Cuotas (opcional): [  /  ]         │
│ Ejemplo: 1/12                      │
│                                    │
│ ☐ Es gasto recurrente              │
│                                    │
│ [ Cancelar ]        [ Guardar ]    │
│                                    │
└────────────────────────────────────┘
```

### 9.4 Importar CSV
```
┌────────────────────────────────────────────────┐
│ Importar Gastos desde CSV                      │
├────────────────────────────────────────────────┤
│                                                │
│ Paso 1: Cargar archivo                         │
│ ┌────────────────────────────────────────────┐│
│ │  📄 Arrastrá tu archivo CSV aquí          ││
│ │     o hacé clic para seleccionar          ││
│ └────────────────────────────────────────────┘│
│ [Seleccionar archivo]                          │
│                                                │
│ Archivo cargado: finanzas-2025.csv (1,159 reg)│
│                                                │
│ Paso 2: Filtrar datos a importar              │
│ ┌────────────────────────────────────────────┐│
│ │ Rango de fechas:                          ││
│ │ Desde: [📅 01/01/2025]                    ││
│ │ Hasta: [📅 31/10/2025]                    ││
│ │                                            ││
│ │ Métodos de pago:                          ││
│ │ ☑ Visa Santander                          ││
│ │ ☑ Amex Gold                               ││
│ │ ☑ Efectivo                                ││
│ │ ☐ Débito BBVA                             ││
│ │                                            ││
│ │ [ Seleccionar todos ] [ Limpiar ]         ││
│ └────────────────────────────────────────────┘│
│                                                │
│ Vista previa (250 de 1,159 registros):        │
│ ┌────────────────────────────────────────────┐│
│ │ Fecha     Tipo    Desc.         Importe   ││
│ │ 23/10/25  Gasto   Metrogas      -10,000   ││
│ │ 22/10/25  Gasto   Partido       -3,000    ││
│ │ ...                                        ││
│ └────────────────────────────────────────────┘│
│                                                │
│ [ Cancelar ]              [ Importar 250 ]    │
│                                                │
└────────────────────────────────────────────────┘
```

### 9.5 Cuotas Pendientes
```
┌────────────────────────────────────────────────┐
│ Cuotas Pendientes                              │
├────────────────────────────────────────────────┤
│                                                │
│ Ordenar por: [Monto pendiente ▼]              │
│                                                │
│ ┌────────────────────────────────────────────┐│
│ │ Calefón Amex Gold                         ││
│ │ Cuota: 3/12  |  Pendientes: 9             ││
│ │ $25,000 x cuota  |  Total pendiente: $225K││
│ │ Finaliza: Ago 2026                        ││
│ ├────────────────────────────────────────────┤│
│ │ Claude Visa Santander                     ││
│ │ Cuota: 1/6   |  Pendientes: 5             ││
│ │ $5,000 x cuota   |  Total pendiente: $25K ││
│ │ Finaliza: Mar 2026                        ││
│ └────────────────────────────────────────────┘│
│                                                │
│ Resumen:                                       │
│ Total gastos en cuotas: 15                     │
│ Monto total pendiente: $850,000                │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 10. Criterios de Aceptación

### Sprint 1: Autenticación y Base
- [ ] Usuario puede registrarse con email y contraseña
- [ ] Usuario puede hacer login y logout
- [ ] Dashboard muestra mensaje de bienvenida
- [ ] Navegación responsive funcional

### Sprint 2: ABMs Básicos
- [ ] CRUD completo de métodos de pago
- [ ] CRUD completo de categorías
- [ ] CRUD completo de macrocategorías
- [ ] Validaciones funcionando correctamente

### Sprint 3: Gestión de Gastos
- [ ] Crear gasto/ingreso manual con todos los campos
- [ ] Editar y eliminar gastos
- [ ] Listar gastos con paginación
- [ ] Formato de cuotas validado correctamente

### Sprint 4: Importación CSV
- [ ] Importar CSV con estructura válida
- [ ] Filtrado por fechas funcional
- [ ] Filtrado por métodos de pago funcional
- [ ] Vista previa muestra registros correctos
- [ ] Importación guarda datos en BD

### Sprint 5: Filtros y Consultas
- [ ] Filtro por rango de fechas funciona
- [ ] Filtro por categorías funciona
- [ ] Filtro por métodos de pago funciona
- [ ] Filtros combinados funcionan correctamente
- [ ] Contador y suma total se actualiza con filtros

### Sprint 6: Cuotas y Recurrentes
- [ ] Vista de cuotas pendientes muestra cálculos correctos
- [ ] Marcar gastos como recurrentes funciona
- [ ] Vincular gastos a serie recurrente funciona
- [ ] Histórico de recurrentes se visualiza correctamente

### Sprint 7: Importación PDF (si tiempo permite)
- [ ] Sistema detecta PDFs de al menos 1 banco
- [ ] Extracción de datos funciona con precisión >90%
- [ ] Usuario puede revisar y editar antes de importar

---

## 11. Anexos

### Anexo A: Ejemplo de Archivo CSV
```csv
Fecha,Ingresos/Gastos,Categoría,Memorándum,Importe
2025-10-23,Gastos,Casa,Metrogas coima,-10000
2025-10-22,Gastos,Deporte,Partido perdido,-3000
2025-10-02,Ingresos,Salario,Sueldo The Flock,2800000
2025-10-01,Gastos,Inversión,Claude visa s 1/6,-30000
```

### Anexo B: Patrones de Detección en Memorándum

**Cuotas:**
- Formato: `n1/n2` donde n1 y n2 son números enteros
- Ejemplos: `1/12`, `3/6`, `10/24`
- Puede aparecer en cualquier parte del texto

**Métodos de Pago:**
- `visa s` → Visa Santander
- `visa g` → Visa Galicia
- `amex s` → American Express Santander
- `amex g` → American Express Gold
- `py` → Pago presencial (puede combinarse: "visa s py")
- Sin texto específico → "Sin especificar"

---

**FIN DE LA ESPECIFICACIÓN FUNCIONAL**
