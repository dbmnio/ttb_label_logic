# Implementation Plan: TTB Label Verification App

This document serves as a step-by-step implementation guide for an AI coding agent. It is organized into phases to ensure a working MVP is achieved early.

## Technical Constraints & Standards
- **Framework:** Next.js (App Router), TypeScript.
- **Styling:** Tailwind CSS + ShadCN UI, adhering to **USWDS (U.S. Web Design System)** (see `@planning/style.md`).
- **Database:** PostgreSQL via Prisma ORM. No mock data; all states must persist.
- **Async Pipeline:** AWS SQS, AWS Rekognition (OCR), AWS Bedrock (Claude 3.5 Sonnet).
- **Architecture:** Decoupled Web Server and Worker service (see `@planning/architecture.md`).

---

## Phase 1: Foundation & Database Layer
**Goal:** Establish the project structure and the data models required for ingestion and queueing.

### ✅ 1.1 Project Initialization
- Initialize Next.js with TypeScript and Tailwind.
- Configure `tailwind.config.ts` with USWDS colors:
    - Primary: `#005ea2`
    - Navy: `#1a4480`
    - Success: `#00a91c`
    - Warning: `#ffbe2e`
    - Error: `#d83933`
- Install Prisma and initialize PostgreSQL connection.

### ✅ 1.2 Data Modeling (Prisma Schema)
Define the following models:
- **`Application`**: `id`, `ttb_id`, `brand_name`, `alcohol_type` (Enum), `status` (Enum: PENDING, PROCESSING, READY, PROCESSED), `user_id` (lock), `locked_at`.
- **`LabelImage`**: `id`, `application_id`, `s3_key`, `type` (FRONT, BACK).
- **`VerificationResult`**: `id`, `application_id`, `checklist_json` (Stores the structured output from Claude), `raw_ocr_json` (Stores Rekognition output).

---

## Phase 2: Ingestion & Queue Management (The Core Flow)
**Goal:** Allow users to submit applications and view them in a managed queue.

### ✅ 2.1 Manual Ingestion Form (`/ingestion`)
- Create a form mimicking TTB Form 5100.31.
- Implement file uploads for Front and Back labels (upload to S3).
- **Database Action:** On submit, create the `Application` and `LabelImage` records.

### ✅ 2.2 The Queue Grid (`/queue`)
- Build the card-based dashboard using ShadCN `Card`.
- Implement filters for "Malt Beverage", "Wine", and "Distilled Spirits".
- **Concurrency Control:** Implement the "Select Card" logic. When a user clicks a card, update the `Application` record with `user_id` and `locked_at` using a database transaction to prevent race conditions.

---

## Phase 3: The AI Worker & Pipeline (Background Processing)
**Goal:** Implement the asynchronous processing that "reads" the labels.

### ✅ 3.1 Worker Service
- Create a separate Node.js/TypeScript worker process.
- Setup an SQS listener to pull `application_id` from the queue.

### ✅ 3.2 Detection & Evaluation
- **Step 1 (Rekognition):** Call `DetectText` to get words and polygon coordinates. Store in `VerificationResult.raw_ocr_json`.
- **Step 2 (Bedrock):** Send the image and the OCR text to Claude 3.5 Sonnet.
- **The Lookup Pattern:** Claude must return a JSON object where each checklist item (e.g., "Net Contents") includes a `polygon_id` mapping to the Rekognition data.
- **Update:** Set `Application.status` to `READY` when complete.

---

## Phase 4: The Verification Wizard (Human-in-the-Loop)
**Goal:** The high-speed interface for workers to approve or reject.

### ✅ 4.1 Split-Screen Layout (`/verify/:id`)
- **Left (Checklist):** Progressive disclosure of requirements (Brand Name -> Alcohol Content -> etc.).
- **Right (Viewer):** Interactive image viewer.
- **Keyboard Shortcuts:**
    - `a`: Accept/Pass
    - `m`: Modify/Fail (auto-focuses comment box)
    - `Left/Right Arrows`: Navigate steps.

### ✅ 4.2 Auto-Zoom & Highlighting
- When a checklist item is active, use the `polygon_id` from the DB to draw a `BoundingBox` overlay on the image.
- Trigger a smooth pan/zoom animation to center the highlighted text in the viewer.

---

## Phase 5: Artifacts, Bulk Ingestion & Audit
**Goal:** Finalize decisions and handle high-volume data.

### ✅ 5.1 Bulk Ingestion
- Implement `.zip` upload handler.
- Parse `records.csv` and validate image existence before triggering the background pipeline.

### ✅ 5.2 PDF Generation (`/processed`)
- Use `pdf-lib` to generate the final TTB record.
- Burn the worker's name, timestamp, and "Approved/Rejected" stamps into the "FOR TTB USE ONLY" boxes of the original PDF template.

### ✅ 5.3 History & Audit Trail
- Implement a read-only `/history` table.
- Ensure all historical decisions are searchable by `ttb_id` or `brand_name`.
