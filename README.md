# Loans Manager

**Loans Manager** es una aplicación web para administrar carteras de préstamos personales: clientes, planes, desembolsos, calendarios de cuotas, cobranza, recibos, caja y reportes. Su interfaz está diseñada para usarse desde computadoras, tablets y teléfonos mediante un navegador.

> **Estado del proyecto:** versión en desarrollo con flujos principales implementados y pruebas unitarias básicas. Antes de operar con dinero real se requieren pruebas de integración, validación de concurrencia, respaldo y recuperación, y revisión de seguridad en un entorno equivalente a producción.

## Funcionalidades

- **Autenticación:** inicio y cierre de sesión con cookies HTTP-only firmadas y expiración de sesión.
- **Clientes:** registro, consulta, edición y asignación a cobradores.
- **Planes:** configuración de tasa de interés fijo total, número de cuotas, periodicidad y días de cobranza.
- **Préstamos:** simulación, desembolso, calendario de cuotas y seguimiento de saldos.
- **Pagos:** abonos parciales, pagos anticipados, distribución entre cuotas pendientes y protección frente a reintentos mediante claves de idempotencia.
- **Recibos:** folios consecutivos, historial y comprobantes PDF imprimibles.
- **Caja:** movimientos por desembolsos y pagos, ingresos y egresos manuales, arqueo y cierre diario.
- **Usuarios y permisos:** roles `ADMIN`, `SUPERVISOR` y `COLLECTOR`, con acceso a operaciones según el rol y cartera asignada.
- **Reportes:** métricas de cartera, filtros por fechas y estado, exportación CSV y XLSX.
- **Auditoría:** registro de operaciones críticas nuevas.
- **Diseño responsive:** navegación y formularios adaptados a pantallas táctiles.

## Tecnologías

| Componente | Tecnología |
| --- | --- |
| Aplicación web | Next.js 16.4, App Router, React 19.3 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de datos | PostgreSQL 17 |
| ORM | Prisma 7 y `@prisma/adapter-pg` |
| Validación | Zod 4 |
| Entorno local de base de datos | Docker Compose |
| Pruebas unitarias | Node.js Test Runner |

## Requisitos

- **Node.js 22** recomendado (también es la versión base del `Dockerfile`).
- npm.
- Docker con Docker Compose, o una instancia accesible de PostgreSQL 17.
- Un puerto libre para PostgreSQL (por defecto `5432`) y para Next.js (por defecto `3000`).

## Inicio rápido

### 1. Instalar dependencias

```bash
npm ci
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto. **No lo subas al repositorio.**

```dotenv
# Contraseña del contenedor PostgreSQL
POSTGRES_PASSWORD="CAMBIA_ESTA_CONTRASENA"

# Debe coincidir con la contraseña anterior
DATABASE_URL="postgresql://loans_user:CAMBIA_ESTA_CONTRASENA@localhost:5432/loans_db?schema=public"

# Genera una clave propia con: openssl rand -hex 32
AUTH_SECRET="PEGA_AQUI_UN_SECRETO_ALEATORIO_DE_64_CARACTERES"

# Usuario administrador inicial (solo para el seed)
SEED_ADMIN_NAME="Administrador"
SEED_ADMIN_EMAIL="admin@loansmanager.local"
SEED_ADMIN_PASSWORD="CAMBIA_POR_UNA_CLAVE_SEGURA_DE_12_O_MAS"
```

Para generar `AUTH_SECRET`:

```bash
openssl rand -hex 32
```

**Nota:** si tienes una variable `DATABASE_URL` exportada globalmente en tu terminal, puede prevalecer sobre el archivo `.env`. Compruébalo con `printenv DATABASE_URL` y, si corresponde, ejecuta `unset DATABASE_URL` antes de usar Prisma.

### 3. Iniciar PostgreSQL

```bash
docker compose up -d
```

El archivo `docker-compose.yml` publica PostgreSQL en `127.0.0.1:5432` y conserva sus datos en el volumen `postgres_data`.

### 4. Aplicar migraciones y generar Prisma Client

El repositorio incluye las migraciones existentes. Para una base nueva o para actualizar una base existente con migraciones pendientes:

```bash
npx prisma migrate deploy --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
```

> **Antes de migrar una base existente, realiza un respaldo.** No ejecutes `prisma migrate reset` sobre una base con datos que quieras conservar.

### 5. Crear el primer administrador

```bash
npx prisma db seed --config prisma7.config.ts
```

El seed usa las variables `SEED_ADMIN_*`, exige una contraseña de al menos 12 caracteres y **no sobrescribe** usuarios existentes con el mismo correo. Las contraseñas creadas por el seed se almacenan como hashes bcrypt.

También existe el comando `npm run user:create -- correo contraseña "Nombre"`, que crea un usuario mediante el script heredado `scripts/create-user.ts`; para la primera instalación se recomienda el seed.

### 6. Iniciar la aplicación

```bash
npm run dev
```

Abre **http://localhost:3000/login** e inicia sesión con las credenciales configuradas para el administrador.

## Comandos disponibles

| Comando | Función |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Iniciar el build de producción |
| `npm run lint` | Análisis estático con ESLint |
| `npm run typecheck` | Comprobación de tipos TypeScript |
| `npm test` | Pruebas unitarias |
| `npm run db:generate` | Generar Prisma Client |
| `npm run db:migrate` | Crear/aplicar migraciones en desarrollo |
| `npm run user:create -- ...` | Crear usuario con el script heredado |

Para las operaciones de Prisma también puedes pasar `--config prisma7.config.ts` de forma explícita.

## Roles y permisos

| Operación | ADMIN | SUPERVISOR | COLLECTOR |
| --- | :---: | :---: | :---: |
| Gestionar personal | ✓ | — | — |
| Gestionar planes | ✓ | — | — |
| Crear préstamos | ✓ | ✓ | — |
| Editar clientes | ✓ | ✓ | — |
| Registrar cobros | ✓ | ✓ | ✓* |
| Consultar y administrar caja | ✓ | — | — |
| Consultar reportes | ✓ | ✓ | — |

\* El cobrador opera sobre los clientes/préstamos asignados, según las restricciones implementadas en el servidor. Los controles de autorización deben verificarse también mediante llamadas directas a la API, no solo desde la interfaz.

## Reglas financieras principales

- El interés configurado en el plan es un **porcentaje total fijo sobre el capital**; no representa automáticamente una tasa anual efectiva.
- El préstamo conserva las condiciones utilizadas al momento de crearlo.
- Los importes monetarios se calculan y distribuyen evitando errores de redondeo mediante operaciones en centavos para la asignación de pagos.
- Los pagos se asignan primero a las cuotas pendientes más antiguas.
- Un pago anticipado no reduce por sí mismo el interés total pactado.
- Los pagos admiten una clave de idempotencia para evitar duplicados ante reintentos.
- El cierre de caja compara el saldo acumulado del libro con el efectivo contado; **no** representa únicamente el flujo neto del día.
- El cierre impide nuevos movimientos fechados en el período cerrado o en fechas anteriores. No sustituye una conciliación bancaria.
- La fecha operativa de caja usa actualmente `America/Mexico_City`.

## Rutas principales

| Ruta | Sección |
| --- | --- |
| `/login` | Acceso |
| `/dashboard` | Resumen financiero |
| `/clients` | Clientes |
| `/plans` | Planes |
| `/loans` | Préstamos |
| `/collections` | Cobranza |
| `/receipts` | Recibos |
| `/cash` | Caja |
| `/staff` | Usuarios y asignaciones |
| `/reports` | Reportes |

Los endpoints se encuentran en `src/app/api/`, principalmente bajo `/api/v1/`.

## Estructura del proyecto

```text
loans-manager/
├── prisma/
│   ├── migrations/           # Migraciones SQL
│   ├── schema.prisma         # Modelos y relaciones
│   └── seed.ts               # Administrador inicial
├── scripts/                  # Scripts de mantenimiento
├── src/
│   ├── app/
│   │   ├── (admin)/          # Pantallas protegidas
│   │   ├── api/              # Endpoints HTTP
│   │   └── login/            # Acceso
│   ├── components/           # Componentes de interfaz
│   ├── lib/                  # Autenticación, permisos y utilidades
│   ├── server/               # Lógica financiera del servidor
│   └── generated/prisma/     # Cliente generado por Prisma
├── tests/                    # Pruebas unitarias
├── docker-compose.yml       # PostgreSQL local
├── Dockerfile                # Imagen de aplicación
├── prisma7.config.ts        # Configuración Prisma CLI con seed
└── package.json
```

## Validación antes de desplegar

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Además de estos comandos, realiza pruebas de integración con PostgreSQL para:

1. Autenticación, cierre de sesión y desactivación de usuarios.
2. Acceso de cobradores a clientes asignados y rechazo de clientes no asignados.
3. Creación de préstamos y consistencia del calendario.
4. Pagos simultáneos, reintentos con la misma clave de idempotencia y recibos únicos.
5. Cierre de caja, diferencias de arqueo y rechazo de movimientos retroactivos.
6. Exportaciones CSV/XLSX, impresión de recibos y uso desde teléfonos y tablets.

## Seguridad y operación

- No publiques `.env`, contraseñas, `AUTH_SECRET` ni respaldos de base de datos.
- Usa HTTPS y una clave `AUTH_SECRET` aleatoria y persistente en producción.
- Configura copias de seguridad periódicas y ensaya su restauración.
- Protege la base de datos de conexiones públicas innecesarias.
- Los comprobantes PDF **no son facturas fiscales**.
- Los eventos de auditoría se registran para operaciones nuevas; los datos históricos no se reconstruyen automáticamente.
- Los cierres de caja son inmutables desde la aplicación y no equivalen a conciliaciones bancarias ni ajustes contables.
- Las pruebas unitarias existentes no sustituyen pruebas end-to-end, pruebas de concurrencia ni una auditoría de seguridad.

## Documentación complementaria

- [`COMMERCIAL-UPGRADE.md`](./COMMERCIAL-UPGRADE.md): módulos comerciales y consideraciones de ampliación.
- [`SECURITY-AND-OPERATIONS.md`](./SECURITY-AND-OPERATIONS.md): permisos, cierres de caja, idempotencia, exportaciones y limitaciones operativas.

## Licencia

No se ha definido una licencia de distribución en este repositorio. Todos los derechos quedan reservados hasta que se agregue un archivo `LICENSE`.
