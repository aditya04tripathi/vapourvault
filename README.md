# VaporVault 🌫️🔒

> **Anonymous. Ephemeral. Secure.**
> High-performance file storage API with automatic 24-hour self-destruction.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-green.svg)
![Stack](https://img.shields.io/badge/stack-NestJS%20|%20PostgreSQL%20|%20MinIO%20|%20Redis-purple.svg)

VaporVault is a robust, enterprise-grade backend service designed for secure, temporary file sharing. It completely eliminates the friction of user accounts, providing a seamless "drop and share" experience while ensuring digital hygiene through automated data purging.

**[View Formal Software Requirements Specification (SRS)](./SRS.md)** | **[View Deployment Guide](./DEPLOYMENT.md)**

---

## ⚡ Key Features

- **🚫 Zero Friction**: No sign-ups, no logins, no passwords. Purely anonymous.
- **⏱️ Ephemeral by Design**: 24-hour Time-To-Live (TTL). Files vanish automatically.
- **🛡️ Secure Storage**: S3-compatible storage (MinIO) with pre-signed URL access control.
- **🚀 Asynchronous Processing**: BullMQ & Redis powered job queues for non-blocking performance.
- **🐳 Cloud Native**: Fully containerized with Docker for instant deployment.

---

## 🏗️ System Architecture

VaporVault utilizes a modular, microservices-ready architecture to ensure scalability and reliability.

[![](https://mermaid.ink/img/pako:eNplkW9v0zAQxr_Kya9AdCVN86f4BVLbDNjEaEeGkEj2wk2O1DSxI9sZK22_O06sbmj4Re5sP7-73OMDKWSJhJJKsXYLd0kuwK5lzVGYzAWYty28hW8a1T1cXLw_rlfpHXzgNR5hvr7KvqA212mfwkdm8Dfb37sq_Umvv0HDSmbYEZJF9mottakUpref4Q2sFdcNe_0CWHDB1B6SgUmNVKzC7IaLqxWsNr-wMOfDF9xc70UB13JzhNsOO8y-Ysm1y63UiXW3ccPmZMGKXaVkJ0pIUT3wAnVOnKpf36XaocpcsL8q7b2WZxPc9p9uz-CyRiYsOcSuPRd34FJJQeHyAe2En2Snelf-QwdlgjUahMvHlissn5xwYhQlGdln4yWhP1mtcUQaVA3r9-TQa3JitthgTqhNS6Z2_WwnC7VM_JCyIdSozmLWgGr7VKRr7VNhwpk16Vliu6FaWqcModNZMNQg9EAeCQ2DcRz5YRjMojCeBtHE3u4J9b1gHIbexH838zw_8P34NCJ_hrbeOA5nU3_Sf-KJ50fR6S8N-syd?type=png)](https://mermaid.live/edit#pako:eNplkW9v0zAQxr_Kya9AdCVN86f4BVLbDNjEaEeGkEj2wk2O1DSxI9sZK22_O06sbmj4Re5sP7-73OMDKWSJhJJKsXYLd0kuwK5lzVGYzAWYty28hW8a1T1cXLw_rlfpHXzgNR5hvr7KvqA212mfwkdm8Dfb37sq_Umvv0HDSmbYEZJF9mottakUpref4Q2sFdcNe_0CWHDB1B6SgUmNVKzC7IaLqxWsNr-wMOfDF9xc70UB13JzhNsOO8y-Ysm1y63UiXW3ccPmZMGKXaVkJ0pIUT3wAnVOnKpf36XaocpcsL8q7b2WZxPc9p9uz-CyRiYsOcSuPRd34FJJQeHyAe2En2Snelf-QwdlgjUahMvHlissn5xwYhQlGdln4yWhP1mtcUQaVA3r9-TQa3JitthgTqhNS6Z2_WwnC7VM_JCyIdSozmLWgGr7VKRr7VNhwpk16Vliu6FaWqcModNZMNQg9EAeCQ2DcRz5YRjMojCeBtHE3u4J9b1gHIbexH838zw_8P34NCJ_hrbeOA5nU3_Sf-KJ50fR6S8N-syd)

### Technology Stack & Decisions

| Component          | Tech                 | Why we chose it                                                                       |
| :----------------- | :------------------- | :------------------------------------------------------------------------------------ |
| **Core**           | **NestJS** (Node.js) | Structured, scalable, and type-safe framework perfect for enterprise APIs.            |
| **Database**       | **PostgreSQL**       | ACID-compliant relational integrity for critical file metadata.                       |
| **ORM**            | **Prisma**           | Modern, type-safe database access with automated migrations.                          |
| **Storage**        | **MinIO**            | High-performance, S3-compatible storage that runs anywhere.                           |
| **Queue**          | **BullMQ / Redis**   | Offloads heavy processing from the main thread to ensure sub-20ms API response times. |
| **Infrastructure** | **Docker**           | "Write once, run anywhere" consistency.                                               |

---

## 💻 Frontend Integration Guide

Integrating VaporVault into your React, Vue, or Next.js app is incredibly simple.

### 1. Uploading a File

Use standard `FormData` to send the file. The server handles the `multipart/form-data` stream efficiently.

```javascript
/**
 * Uploads a file to VaporVault
 * @param {File} file - The file object from <input type="file" />
 * @returns {Promise<string>} - The fileId for retrieval
 */
async function uploadToVault(file) {
	const formData = new FormData();
	formData.append('file', file);

	try {
		const response = await fetch('http://localhost:3000/files/upload', {
			method: 'POST',
			body: formData, // Browser automatically sets Content-Type to multipart/form-data
		});

		if (!response.ok) throw new Error('Upload failed');

		const data = await response.json();
		console.log('🎉 Upload Successful! File ID:', data.fileId);
		return data.fileId;
	} catch (error) {
		console.error('Upload Error:', error);
	}
}
```

### 2. Downloading a File

To download, you first request a secure, temporary download URL.

```javascript
/**
 * Gets a secure download link
 * @param {string} fileId - The ID returned from upload
 */
async function getDownloadLink(fileId) {
	const response = await fetch(`http://localhost:3000/files/${fileId}/download`);
	const data = await response.json();

	// data.url is a pre-signed MinIO URL valid for 1 hour
	window.open(data.url, '_blank');
}
```

### 3. Checking File Status

```javascript
/**
 * Checks the processing status of a file
 * @param {string} fileId - The ID returned from upload
 * @returns {Promise<Object>} - Status JSON { status: 'PENDING' | 'COMPLETED', ... }
 */
async function checkStatus(fileId) {
	const response = await fetch(`http://localhost:3000/files/${fileId}/status`);
	const data = await response.json();

	console.log(`File Status: ${data.status}`);
	return data;
}
```

---

## 🚀 Quick Start (Local Dev)

Get the entire infrastructure running in less than 2 minutes.

### Prerequisites

- Docker & Docker Compose
- Node.js v18+ & pnpm

### Command Line

```bash
# 1. Start Infrastructure (DB, Redis, MinIO)
docker-compose up -d

# 2. Install Dependencies
pnpm install

# 3. Initialize Database Schema
pnpm db:dev:push

# 4. Launch API
pnpm start:dev
```

_API is now live at `http://localhost:3000`_

---

## 🧪 Testing Strategy

We maintain high code quality with a comprehensive test suite.

- **Unit Tests**: `pnpm test` (Uses Jest to mock dependencies)
- **E2E Integration**: `./test_flow.sh` (Full lifecycle test: Upload -> Process -> Download)

---

## 📡 API Documentation

Interactive Swagger documentation is auto-generated and available at:
**[http://localhost:3000/api](http://localhost:3000/api)**

---

_Built with ❤️ by Aditya Tripathi_
