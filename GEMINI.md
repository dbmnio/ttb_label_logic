# GEMINI.md - TTB Label Verification App

## Project Overview
The **TTB Label Verification App** is a high-performance, human-in-the-loop AI application designed to automate and assist the verification of alcohol beverage labels (TTB Form 5100.31). It bridges the gap between manual regulatory review and automated OCR/LLM analysis to ensure compliance with federal labeling requirements for Malt Beverages, Wine, and Distilled Spirits.

### Key Features
- **AI-Powered Extraction:** Uses Amazon Rekognition for precise text localization (polygonal coordinates) and Amazon Bedrock (Claude 3.5 Sonnet) for semantic evaluation against complex checklist rules.
- **Verification Wizard:** A split-screen, keyboard-optimized interface with auto-zoom and bounding box highlights for rapid human validation.
- **Bulk Ingestion:** Supports `.zip` manifest uploads for high-volume processing.
- **Concurrency Management:** Native PostgreSQL row-level locking for multi-user queue management.
- **Artifact Generation:** Produces flattened, stamped PDFs of the official TTB forms.

## Technology Stack
- **Frontend/API:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, ShadCN UI.
- **Design System:** USWDS (U.S. Web Design System) guidelines.
- **Database:** PostgreSQL (Amazon RDS) with Prisma ORM.
- **Asynchronous Pipeline:** Amazon SQS (Buffering) + ECS Fargate (Worker Service).
- **AI/ML:** Amazon Rekognition (OCR) and Amazon Bedrock (Claude 3.5 Sonnet).
- **Storage:** Amazon S3 (Label Images and Artifacts).

## Project Structure
- `planning/`: **CRITICAL CONTEXT.** Contains the architectural blueprints, implementation plans, and style guides.
    - `architecture.md`: System design and AWS integration.
    - `implementation.md`: Step-by-step roadmap for features.
    - `style.md`: USWDS-specific UI constraints (colors, typography).
    - `user_flows.md`: Detailed descriptions of Ingestion, Queue, and Wizard logic.
- `assets/`: Reference PDFs and templates (e.g., TTB Form 5100.31).
- `src/`: (Planned) Application source code.

## Development Status
This project is currently in the **Initialization/Planning Phase**. The foundation has been laid through comprehensive documentation in the `planning/` directory.

### Immediate Roadmap (Phase 1)
1. Initialize Next.js project with TypeScript and Tailwind.
2. Configure USWDS theme in `tailwind.config.ts`.
3. Define the Prisma schema (`Application`, `LabelImage`, `VerificationResult`).
4. Set up the basic Next.js App Router structure.

## Building and Running (Planned)
> *Note: These commands reflect the planned Next.js environment.*

- **Install Dependencies:** `npm install`
- **Database Migration:** `npx prisma db push`
- **Start Development Server:** `npm run dev`
- **Run AI Worker:** (To be defined, likely a separate script or container entry point).

## Development Conventions
- **UI/UX:** Strictly adhere to `planning/style.md`. Use USWDS colors and Public Sans font. Ensure 508 compliance (accessibility).
- **Concurrency:** Use `SELECT ... FOR UPDATE` via Prisma for card locking in the queue.
- **AI Interaction:** Follow the "Lookup Table" pattern (Rekognition polygon IDs passed to LLM) to ensure deterministic bounding boxes in the UI.
- **Errors:** Gracefully degrade to normalized coordinate bounding boxes if OCR fails.
