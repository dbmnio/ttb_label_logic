# Alcohol Label Approval Verification App - User Flows

This document outlines the core user flows and architectural blueprints for the manual verification application designed to facilitate alcohol label approvals (e.g., TTB Form 5100.31). 

---

## 1. The Ingestion Hub (Application Onboarding)

The system provides three distinct methods for ingesting application data to handle both single-entry synchronous tasks and high-volume asynchronous processing.

### A. Bulk Ingestion Mode (Primary Path)
* **The Flow:** The user uploads a `.zip` manifest bundle containing a `records.csv` (or `.json`) and an `images/` subfolder.
* **Pre-Flight Check:** The UI streams the upload and performs a quick validation to ensure all images referenced in the manifest exist in the bundle. Missing files flag specific rows in red, allowing inline browser uploads to fix broken links.
* **Background Pipeline:** Once greenlit, the batch is pushed to an asynchronous processing queue. For each item in the queue, a backend worker extracts text, runs evaluations, and prepares the verification state.
* **Notification:** The user receives a "Batch Processing Complete" email with a direct link to the verified batch in the Queue Grid.

### B. Manual Entry Mode
* **The Flow:** The user fills out a web form styled identically to the official TTB paper form for cognitive mapping (see https://www.ttb.gov/system/files/images/pdfs/forms/f510031.pdf)
* **Image Handling:** The user drags and drops label images into specific zones (Front, Back/Other).

---

## 2. The Queue Grid & Workload Management

A highly scannable, card-based dashboard that acts as the command center for workers to select, prioritize, and manage their verification workload.

### Anatomy of the Queue Card
* **Header:** Application ID and an icon indicating alcohol type (e.g., Malt Beverage, Wine, Distilled Spirits).
* **Primary Focus:** Brand Name (e.g., "ENGKANTO") displayed prominently.
* **AI Confidence Bar:** A visual color indicator representing the AI's pre-check confidence (Green for 95%+, Yellow for 70-94%, Red for low confidence/errors).
* **Footer:** Submission date, formatted relatively (e.g., "Submitted: 2 days ago").

### Multi-User Concurrency & States
* **Available:** Standard opaque cards.
* **Processing:** Greyed out with a spinner (currently in the AI pre-processing pipeline).
* **Locked (Checked-Out):** When a user clicks a card, it is locked to them (Mutex). The card dims, displays a "Locked by [User]" tag, and cannot be accessed by other workers until completed or explicitly returned to the queue. Optimistic locking UI resolves simultaneous click collisions gracefully.

### Navigation & Sorting
* **Sorting Options:** Users can sort by "Easy Wins" (highest AI confidence), "SLA" (oldest submission date), or filter by specific alcohol categories.
* **Power-User Navigation:** Fully navigable via keyboard using arrow keys. Hitting `Enter` locks the card and drops the user into the Verification Wizard.

---

## 3. The Verification Wizard (Core Human-in-the-Loop Flow)

A split-screen, "TurboTax-style" interface optimized for speed, ergonomics, and progressive disclosure.

### Layout Overview
* **Left Panel (The Wizard):** Displays one checklist item at a time (e.g., Brand Name, Name & Address, Health Warning). Includes the AI's confidence score, drafted insights, and "Pass/Fail" action buttons.
* **Right Panel (Context Viewer):** A sticky, zoomable image viewer displaying the submitted application data and the associated label image.

### The Verification Loop
* **AI Assistance:** For each checklist step, the AI pre-fills the suggested answer. If the suggestion is to reject, it prefills a comment.  The user can quickly accept the suggestion, or modify it freely.  In the image viewer, an AI-generated bounding box automatically highlights the relevant text on the physical label.
* **Auto-Scroll & Zoom:** As the wizard advances, the right panel dynamically pans and zooms to the exact location of the text being verified (e.g., zooming into the bottom corner for "Net Contents").
* **Keyboard-Centric Control:** Hotkeys (e.g., `a` for Accept, `m` for modify, arrow keys for Next/Previous) allow workers to fly through the checklist without reaching for a mouse.
* **Exception Handling:** the app keeps track of failed checklist items and associated comments.

---

## 4. Export, Print, and Audit (The Output Pipeline)

The final flow for wrapping up processed applications, generating official artifacts, and maintaining compliance records.

### The "Processed" View
* A dedicated data table separate from the active queue, showing Application ID, Brand Name, Decision (Approved/Rejected), and Processed Date.

### Artifact Generation (Print/Export)
* **The Action:** Clicking "Print" or selecting multiple rows for "Bulk Export" triggers the backend to generate a flattened PDF.
* **The Artifact:** The system merges the original submitted PDF with the worker's decisions. It burns the final status, the worker's ID/timestamp, and any drafted rejection comments directly into the "FOR TTB USE ONLY" boxes. The checklist summary and isolated label images are appended as secondary pages.

### Archiving & Auditability
* **Auto-Archive:** The default behavior instantly moves items out of the active "Processed" view the moment they are exported/printed, maintaining a clean workspace.
* **Read-Only Audit Trail:** Archived items live in a strict History view. Managers and auditors can search by Application ID to review the final artifact, who approved/rejected it, and when the action occurred.

---

## Complete Blueprint Summary
1. **Ingestion Hub:** Seamlessly handles async bulk uploads and single-entry sync requests.
2. **Queue Grid:** Surfaces AI confidence and manages multi-user state/locks.
3. **Verification Wizard:** Turbocharges human review with bounding boxes, auto-zoom, and hotkeys.
4. **Export & Audit:** Generates final flattened PDFs and maintains a clean, auditable workspace.
