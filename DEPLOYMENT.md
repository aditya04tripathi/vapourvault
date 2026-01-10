# VaporVault Deployment Guide 🚀

This guide covers the deployment of the VaporVault Anonymous File Storage Service using Docker and Docker Compose.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your host machine:

- **Docker Engine**: v20.10+
- **Docker Compose**: v1.29+
- **Node.js** (Optional, for local development): v18+

---

## 🛠️ Deployment Steps

### 1. Clone the Repository

```bash
git clone <repository_url>
cd vapor-vault
```

### 2. Environment Configuration

Create a `.env` file in the root directory. You can copy the example:

```bash
cp .env.example .env
```

Ensure the following variables are set for a production-like environment:

```ini
# Application
PORT=3000
NODE_ENV=production

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/vaporvault?schema=public"

# Queue (Redis)
REDIS_HOST=localhost
REDIS_PORT=6379

# Storage (MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=vaporvault
```

### 3. Start Infrastructure

Use Docker Compose to spin up the required services (PostgreSQL, Redis, MinIO).

```bash
docker-compose up -d
```

### 4. Database Setup

Apply the database schema using Prisma.

```bash
# Push schema to database
pnpm db:dev:push
```

### 5. Start the Application

You have two options: processing running locally or via Docker.

**Option A: Running Locally (with Node.js)**

```bash
# Install dependencies
pnpm install

# Build the application
pnpm build

# Start production server
pnpm start:prod
```

**Option B: Full Docker Deployment**

(Assuming a full `docker-compose.prod.yml` exists or using the main compose file if it includes the app service)

```bash
docker-compose -f docker-compose.yml up -d --build
```

---

## 🔍 Verification

1.  **Check API Health**: Visit `http://localhost:3000/health` (if implemented) or check the Swagger docs at `http://localhost:3000/api`.
2.  **Verify MinIO**: Access the MinIO Console at `http://localhost:9001` (default console port).

---

## 🧹 Maintenance

**Manual Cleanup**:
While the Cron job handles standard cleanup, you can manually trigger cleanups if needed via script or by connecting to the container context.

**Logs**:
View logs for troubleshooting:

```bash
docker-compose logs -f
```
