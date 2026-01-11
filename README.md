# VaporVault 🌫️🔒

> **Anonymous. Ephemeral. Secure.**
> High-performance file storage API with automatic 24-hour self-destruction.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-green.svg)
![Stack](https://img.shields.io/badge/stack-NestJS%20|%20PostgreSQL%20|%20MinIO%20|%20Redis-purple.svg)

VaporVault is a robust, enterprise-grade backend service designed for secure, temporary file sharing. It completely eliminates the friction of user accounts, providing a seamless "drop and share" experience while ensuring digital hygiene through automated data purging.

---

## 📚 Documentation

- **[View Software Requirements Specification (SRS)](./SRS.md)**: Detailed breakdown of functional requirements and system constraints.

---

## ⚡ Key Features

- **🚫 Zero Friction**: No sign-ups, no logins, no passwords. Purely anonymous.
- **⏱️ Ephemeral by Design**: 24-hour Time-To-Live (TTL). Files vanish automatically.
- **🛡️ Secure Storage**: S3-compatible storage (MinIO) with pre-signed URL access control.
- **🚀 Asynchronous Processing**: BullMQ & Redis powered job queues for non-blocking performance.
- **🐳 Cloud Native**: Fully containerized with Docker for instant deployment.

---

## 🏗️ System Architecture

VaporVault utilizes a modular architecture to ensure scalability and reliability.

### Technology Stack

| Component          | Tech               | Why we chose it                                                                        |
| :----------------- | :----------------- | :------------------------------------------------------------------------------------- |
| **Core**           | **NestJS**         | Structured, scalable, and type-safe framework perfect for enterprise APIs.             |
| **Database**       | **PostgreSQL**     | ACID-compliant relational integrity for critical file metadata.                        |
| **ORM**            | **Prisma**         | Modern, type-safe database access with automated migrations.                           |
| **Storage**        | **MinIO**          | High-performance, S3-compatible storage that runs anywhere.                            |
| **Queue**          | **BullMQ / Redis** | Offloads heavy processing from the main thread to ensure sub-200ms API response times. |
| **Infrastructure** | **Docker**         | "Write once, run anywhere" consistency.                                                |

---

## 🚀 Setup and Installation

### Prerequisites

- Docker & Docker Compose
- Node.js v18+ & pnpm (optional, for local dev without Docker)

### Quick Start (Docker)

Get the entire infrastructure running in less than 2 minutes.

```bash
# 1. Start Infrastructure (DB, Redis, MinIO) & API
docker-compose up -d --build
```

The API will be available at `http://localhost:3000`.

### Local Development (Manual)

If you prefer running the app locally while keeping services in Docker:

```bash
# 1. Start Infrastructure (DB, Redis, MinIO)
docker-compose up -d

# 2. Install Dependencies
pnpm install

# 3. Initialize Database Schema
pnpm prisma db push

# 4. Launch API
pnpm start:dev
```

---

## 📖 Usage

### Uploading a File

Use standard `FormData` or the Presigned URL flow.

**Method 1: Direct Upload**

```bash
curl -X POST http://localhost:3000/files/upload \
  -F "file=@/path/to/your/image.png"
```

**Method 2: Presigned Flow (Recommended for large files)**

1.  **Get Presigned URL**: `POST /files/presign-upload`
2.  **Upload to URL**: `PUT <presigned-url> --data-binary @file`
3.  **Complete Upload**: `POST /files/complete-upload`

### Downloading a File

```bash
# 1. Request Download Link
GET http://localhost:3000/files/{fileId}/download

# 2. Response
{
  "url": "http://minio-host/bucket/..." // Valid for 1 hour
}
```

---

## ⚙️ Configuration

The application is configured via environment variables. See `.env.example` (if available) or `docker-compose.yml` for defaults.

| Variable         | Description                  | Default                                                |
| :--------------- | :--------------------------- | :----------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL Connection String | `postgresql://user:password@localhost:5432/vaporvault` |
| `REDIS_HOST`     | Redis Host                   | `localhost`                                            |
| `MINIO_ENDPOINT` | MinIO Host                   | `localhost`                                            |

---

## 🧪 Deployment

This project is Docker-first.

- **Production**: Use the provided `Dockerfile` and `docker-compose.yml`. Ensure environment variables are set for production security (passwords, secrets).
- **CI/CD**: The test suite runs via `pnpm test` (Unit) and script-based flows.

---

## ⚠️ Limitations and Assumptions

- **Anonymous Access**: There is no user isolation. Anyone with a `fileId` can access the file.
- **TTL Enforcement**: Deletion happens via a scheduled cron job. Files may persist slightly longer than 24h until the next job run.
- **File Size**: Default limits are set by Nginx/NestJS (typically 5MB-100MB depending on config).

---

## 📜 License

This project is licensed under the terms described in the **[LICENSE](./LICENSE)** file.
