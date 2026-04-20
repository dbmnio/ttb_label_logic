# GEMINI.md - TTB Label Verification App

## Project Overview
The **TTB Label Verification App** is a high-performance, human-in-the-loop AI application designed to automate and assist the verification of alcohol beverage labels (TTB Form 5100.31). It bridges the gap between manual regulatory review and automated OCR/LLM analysis to ensure compliance with federal labeling requirements for Malt Beverages, Wine, and Distilled Spirits.

### Key Features
- **AI-Powered Extraction:** Uses Amazon Rekognition for precise text localization (polygonal coordinates) and Amazon Bedrock (Claude 3.5 Sonnet via Inference Profiles) for semantic evaluation against complex checklist rules.
- **Verification Wizard:** A split-screen, keyboard-optimized interface with auto-zoom and bounding box highlights for rapid human validation. Includes secure rendering of private S3 images via Pre-signed URLs.
- **Bulk Ingestion:** Supports `.zip` manifest uploads for high-volume processing.
- **Concurrency Management:** Native PostgreSQL row-level locking for multi-user queue management.
- **Artifact Generation:** Produces flattened, stamped PDFs of the official TTB forms, including rejection reasons.
- **Audit Trail:** Fully tracks approvals (`PROCESSED`) and rejections (`REJECTED`) with explicit rejection reason logging.

## Technology Stack
- **Frontend/API:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, ShadCN UI.
- **Design System:** USWDS (U.S. Web Design System) guidelines.
- **Database:** PostgreSQL (Amazon RDS) using **Prisma 7** with `@prisma/adapter-pg` and the Node `pg` driver (configured for strict SSL validation via `sslrootcert`).
- **Asynchronous Pipeline:** Amazon SQS (Buffering) + Node.js Worker Service.
- **AI/ML:** Amazon Rekognition (OCR) and Amazon Bedrock (Claude 3.5 Sonnet inference profile: `us.anthropic.claude-sonnet-4-6`).
- **Storage:** Amazon S3 (Label Images and Artifacts).

## Project Structure
- `planning/`: Contains the architectural blueprints, implementation plans, and style guides.
    - `architecture.md`: System design and AWS integration.
    - `implementation.md`: Step-by-step roadmap for features (MVP Completed).
    - `style.md`: USWDS-specific UI constraints (colors, typography).
    - `user_flows.md`: Detailed descriptions of Ingestion, Queue, and Wizard logic.
- `assets/`: Reference PDFs and templates (e.g., TTB Form 5100.31).
- `scripts/`: Testing and utility scripts.
    - `upload-mock-images.ts`: Uploads local test images to the S3 bucket.
    - `enqueue-test.ts`: Creates a pending DB record and pushes a test message to the SQS queue.
- `src/`: Next.js web application and worker source code.

## Development Status
The **Initial MVP is complete**. The core ingestion pipeline, background worker, and verification wizard are fully functional.

## Building and Running

- **Install Dependencies:** `npm install`
- **Database Migration:** `npx prisma db push`
- **Generate Prisma Client:** `npx prisma generate`
- **Seed Database:** `npx prisma db seed`
- **Start Web Application:** `npm run dev`
- **Run AI Worker:** `npm run worker`
- **Test Worker Pipeline:** `npm run upload-mocks` followed by `npm run test-pipeline`

## Development Conventions
- **UI/UX:** Strictly adhere to `planning/style.md`. Use USWDS colors and Public Sans font.
- **Prisma 7:** We use `engineType="library"` alongside a driver adapter (`@prisma/adapter-pg`) due to Prisma 7 breaking changes.
- **AI Interaction:** Follow the "Lookup Table" pattern (Rekognition polygon IDs passed to LLM) to ensure deterministic bounding boxes in the UI.
- **S3 Security:** All S3 label images remain private. The Next.js server dynamically generates short-lived Pre-signed URLs for the UI to render them.