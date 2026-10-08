# Loans Manager

Aplicación de gestión de préstamos personales con Next.js, TypeScript, Prisma y PostgreSQL.

## Alcance de esta entrega (fases 2–9)

- Esquema Prisma para usuarios, clientes, planes, préstamos, cuotas, pagos y asignaciones.
- Inicio y cierre de sesión con cookie firmada.
- Pantallas de clientes, planes, préstamos, cobranza y dashboard.
- Simulación de préstamos, generación de cuotas y registro de pagos de importe personalizado.
- Aplicación de pagos a las cuotas pendientes en orden y cálculo de saldo vencido.

**Estado:** base de implementación para desarrollo. No se ha validado aquí el build, las migraciones ni los flujos end-to-end. No usar con dinero real sin pruebas y revisión de seguridad. La reversión de pagos, auditoría financiera completa, reportes y otras funciones del roadmap siguen pendientes.

## Requisitos

Node.js compatible con Next.js 16, npm y Docker Compose.

## Instalación

```bash
cp .env.example .env
# Configura POSTGRES_PASSWORD, DATABASE_URL y AUTH_SECRET
# Genera AUTH_SECRET con: openssl rand -hex 32
npm install
docker compose -f docker-compose.yml up -d
npx prisma generate
npx prisma migrate dev --name init
npm run user:create
npm run dev
```

La aplicación estará disponible en http://localhost:3000.

## Validaciones recomendadas

```bash
npm run typecheck
npm run lint
npm run build
```

## Consideraciones financieras

El interés del plan es un porcentaje total fijo sobre el principal. Las cuotas se calculan con centavos exactos. Los pagos personalizados se aplican a las cuotas con saldo, en orden ascendente, y no disminuyen el interés pactado. Los estados de mora se derivan de la fecha de vencimiento y del saldo pendiente.
