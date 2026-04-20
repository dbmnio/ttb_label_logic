## I. App State & Navigation Diagram

This diagram represents the user flow and routing architecture. An AI coding agent should use this to structure the front-end router (e.g., React Router).

```text
[ /ingestion ] (Ingestion Hub)
      │
      ├─> Asynchronous Upload ─> Background Processing
      │
      └─> Synchronous Form ─> [ /queue ]
                                   │
[ /queue ] (Queue Grid) <──────────┘
      │
      ├─> Filter/Sort Controls
      │
      └─> Select Card (Lock State) ─> [ /verify/:app_id ]
                                              │
[ /verify/:app_id ] (Verification Wizard) <───┘
      │
      ├─> Step-by-Step Checklist (Pass/Fail)
      │
      └─> Complete Verification ─> [ /processed ]
                                          │
[ /processed ] (Processed View & Export) <┘
      │
      ├─> Bulk Export/Print (PDF Generation)
      │
      └─> Auto-Archive ─> [ /history ] (Read-Only Audit Trail)
```

---

## II. Detailed UI Page Blueprints

### 1. The Ingestion Hub (`/ingestion`)
**Purpose:** Onboard application data via bulk upload or manual entry.

* **Layout Structure:** Split view or tabbed interface (Tab 1: Bulk Upload, Tab 2: Manual Entry).
* **Component: Bulk Upload Dropzone**
    * A large dashed-border drag-and-drop zone centered on the page.
    * **Validation UI:** Below the dropzone, a dynamic list appears showing the parsed `records.csv`. Rows missing images are highlighted with a red background and feature a file input button labeled "Upload Missing Image."
* **Component: Manual Entry Form**
    * Styled to mimic the TTB Form 5100.31 for cognitive mapping.
    * [cite_start]Contains fields like "Brand Name", "Fanciful Name", and checkboxes for "Domestic" or "Imported"[cite: 29, 30, 49, 51].
    * Includes two distinct image upload zones labeled "Front Label" and "Back/Other Label".

### 2. The Queue Grid (`/queue`)
**Purpose:** Scannable workload management and concurrency control.

* **Layout Structure:** CSS Grid layout with a top control bar.
* **Component: Control Bar (Top)**
    * Dropdown for sorting: "Easy Wins" (AI Confidence Descending) and "SLA" (Date Ascending).
    * Pill-based filters for Alcohol Type: "Malt Beverage", "Wine", "Distilled Spirits".
* **Component: Queue Cards (Grid Items)**
    * **Dimensions:** Fixed height, flexible width (e.g., `minmax(300px, 1fr)`).
    * **Header:** Alcohol type icon (e.g., a beer mug for Malt Beverage) and App ID.
    * [cite_start]**Body:** Large typography for the Brand Name (e.g., "ENGKANTO")[cite: 50, 115].
    * **Footer:** Relative submission date (e.g., "2 days ago").
    * **AI Confidence Bar:** A thin `div` at the bottom of the card spanning 100% width. Background color is dynamic: `#10B981` (Green > 95%), `#F59E0B` (Yellow 70-94%), `#EF4444` (Red < 70%).
    * **State UI:** * *Processing:* Card opacity at 50%, absolute positioned loading spinner over the card.
        * *Locked:* Card gets a dark overlay, pointer events disabled, with a badge reading "Locked by [Username]".

### 3. The Verification Wizard (`/verify/:app_id`)
**Purpose:** High-speed, human-in-the-loop review interface.

* **Layout Structure:** Split-screen layout. Left Panel (35vw), Right Panel (65vw).
* **Left Panel (The Wizard):**
    * [cite_start]**Checklist Item Header:** Displays the current mandatory item, such as "Brand Name", "Class/Type", or "Net Contents"[cite: 3, 5].
    * [cite_start]**AI Insight Box:** A styled container showing the AI's confidence score and suggested action (e.g., "AI Suggests: Pass - Net contents found as 330 ML" [cite: 120]).
    * **Action Buttons:** Large "Pass" (Green) and "Fail" (Red) buttons.
    * **Comment Input:** A text area that automatically reveals and pre-fills if the AI suggests a rejection.
* **Right Panel (Context Viewer):**
    * A sticky container that takes up the full height of the viewport (`100vh`).
    * Contains an HTML `<canvas>` or specialized image viewer (like OpenSeadragon) displaying the label image.
    * **Overlay:** Absolute positioned, semi-transparent colored bounding boxes (`border: 2px solid yellow`) highlighting the specific text on the label relevant to the current wizard step.

### 4. Processed View & Export (`/processed` & `/history`)
**Purpose:** Artifact generation and auditability.

* **Layout Structure:** Full-width data tables.
* **Component: Processed Table**
    * Columns: Checkbox (for bulk selection), App ID, Brand Name, Decision (Approved/Rejected badge), Processed Date.
    * **Action Bar (Top):** "Print Selected" and "Bulk Export PDF" buttons.
* **Component: History/Audit Table**
    * Read-only version of the Processed table.
    * [cite_start]Includes a "View Artifact" button that opens the final, flattened PDF with the worker's decision burned into the "FOR TTB USE ONLY" box[cite: 10, 93].

---

## III. Implementation Directives for the AI Coding Agent

To ensure the coding agent implements this without ambiguity, provide it with these technical constraints:

1.  **State Management (Crucial for Multi-User Locks):**
    * Use a robust state manager (like Redux or Zustand in React) coupled with WebSockets or Server-Sent Events (SSE). Optimistic UI updates must be implemented for locking queue cards. If a `409 Conflict` returns from the server when locking a card, the UI must gracefully revert the card to "Locked by [Other User]" and notify the current user.
2.  **Keyboard Navigation (The Wizard):**
    * Attach global event listeners (`keydown`) when the `/verify/:app_id` route mounts.
    * Map `a` to trigger the `handlePass()` function.
    * Map `m` to focus the comment `textarea`.
    * Map `ArrowRight` and `ArrowLeft` to advance or return the checklist step.
3.  **Image Auto-Zooming:**
    * Store X/Y coordinates and zoom scale parameters for each checklist item in the backend database.
    * When the wizard step changes, the frontend must trigger a CSS transform or library method (e.g., `panzoom.zoomTo(x, y, scale)`) to animate the right panel to the corresponding label bounding box.
4.  **PDF Generation:**
    * Use a library like `pdf-lib` to handle the final artifact generation. [cite_start]The agent must calculate absolute X/Y coordinates to overlay text (Decision, Timestamp, User ID) specifically into the blank "FOR TTB USE ONLY" zones of the original PDF[cite: 10, 93].
