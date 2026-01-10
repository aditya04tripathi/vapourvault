# Software Requirements Specification (SRS)

## Project: VaporVault (Anonymous File Storage)

**Version**: 1.0.0
**Date**: 2026-01-11

---

## 1. Introduction

### 1.1 Purpose

The purpose of this document is to define the functional and non-functional requirements for the **VaporVault: Anonymous File Storage Service**. This system allows users to upload, store, and share files temporarily without authentication. It serves as a secure, ephemeral file exchange platform with guaranteed data expiration.

### 1.2 Scope

VaporVault is a backend API system that facilitates:

- Anonymous file uploads via REST API.
- Secure, time-limited storage of binary data.
- Automatic metadata extraction and asynchronous processing.
- Automated data purging based on a 24-hour Time-To-Live (TTL) policy.
- Stateless architecture requiring no user accounts or persistent identity management.

### 1.3 Definitions, Acronyms, and Abbreviations

- **SRS**: Software Requirements Specification.
- **TTL**: Time-To-Live; the duration for which a file is retained before deletion.
- **API**: Application Programming Interface.
- **MinIO**: High-performance, S3-compatible object storage.
- **Presigned URL**: A temporary URL granting access to a specific object in storage.
- **DTO**: Data Transfer Object.

---

## 2. Overall Description

### 2.1 Product Perspective

This system operates as a standalone microservice deployable within a containerized environment (Docker). It interacts with external components including a PostgreSQL database for metadata, Redis for job queuing, and MinIO for object storage.

### 2.2 Product Functions

1.  **Direct File Upload**: Accepting `multipart/form-data` uploads.
2.  **Presigned Uploads**: Generating secure URLs for direct-to-storage uploads.
3.  **File Retrieval**: Providing secure download links for stored files.
4.  **Lifecycle Management**: Automatically deleting files after 24 hours.
5.  **System Monitoring**: Providing status checks and file listing capabilities.

### 2.3 User Classes and Characteristics

- **Anonymous User**: Any user with network access to the API.
- **Administrator**: System maintainers with infrastructure access.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 File Upload

- **FR-01**: The system shall accept file uploads via `POST /files/upload` using `multipart/form-data`.
- **FR-02**: The system shall support a `POST /files/presign-upload` endpoint to generate presigned URLs.
- **FR-03**: Upon successful upload, the system must generate a unique `fileId` (UUID).
- **FR-04**: The system must preserve the original MIME type and filename.

#### 3.1.2 File Storage & Processing

- **FR-05**: Files shall be stored in S3-compatible object storage (MinIO) under `uploads/anonymous/{fileId}/{filename}`.
- **FR-06**: A background job shall be enqueued immediately after upload to process file metadata.
- **FR-07**: File metadata shall be persisted in a PostgreSQL database.

#### 3.1.3 Data Retrieval

- **FR-08**: Users shall retrieve files via `GET /files/{fileId}/download`.
- **FR-09**: The retrieval endpoint shall return a presigned download URL valid for 1 hour.
- **FR-10**: The system shall return metadata and processing status via `GET /files/{fileId}/status`.

#### 3.1.4 Data Expiration (TTL)

- **FR-11**: All files shall have a mandatory Time-To-Live (TTL) of 24 hours.
- **FR-12**: A scheduled Cron task shall execute hourly to identify files created > 24 hours ago.
- **FR-13**: Expired files must be permanently deleted from both the database and object storage.

### 3.2 Non-Functional Requirements

#### 3.2.1 Performance

- **NFR-01**: API response time for metadata operations shall be under 200ms.
- **NFR-02**: The system shall utilize asynchronous queues (BullMQ) to prevent blocking the main thread.

#### 3.2.2 Security

- **NFR-03**: Low-friction design: No user authentication (registration/login) required.
- **NFR-04**: Access controlled by the secrecy of the 128-bit UUID `fileId`.
- **NFR-05**: All storage URLs must be signed (Presigned URLs).

#### 3.2.3 Reliability & Availability

- **NFR-06**: ACID compliance for metadata consistency.
- **NFR-07**: Docker containerization for consistent deployment.

---

## 4. System Architecture

### 4.1 Technology Stack

| Component      | Technology      | Description                  |
| :------------- | :-------------- | :--------------------------- |
| **Framework**  | NestJS          | NodeJS Application Framework |
| **Language**   | TypeScript      | Statically typed JavaScript  |
| **Database**   | PostgreSQL      | Relational Metadata Storage  |
| **ORM**        | Prisma          | Type-safe Database Client    |
| **Storage**    | MinIO           | S3-Compatible Object Storage |
| **Queue**      | BullMQ & Redis  | Asynchronous Job Processing  |
| **Scheduling** | NestJS Schedule | Cron tasks for TTL cleanup   |
| **Ops**        | Docker          | Container Orchestration      |

### 4.2 API Specification

See [Swagger UI](http://localhost:3000/api) for interactive documentation.
