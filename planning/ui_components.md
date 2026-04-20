## 1. Core Primitives (Atoms)
These are the foundational building blocks of the application, strictly adhering to the modern USWDS style guidelines we established.

| Component Name | Description | USWDS Style Directives |
| :--- | :--- | :--- |
| `Button` | The primary interactive element for actions. | Variants: `Primary` (Solid Blue), `Secondary` (Outline Blue), `Success` (Solid Green), `Danger` (Solid Red). `4px` border radius. |
| `Badge` / `Tag` | Small visual indicators for status or categories. | Used for "Pass/Fail" results, "Processing" states, and Alcohol Type (e.g., Malt Beverage). |
| `Card` | A generic container with a white background. | `1px` solid gray border (`#dfe1e2`), subtle drop shadow (`box-shadow: 0 2px 4px rgba(0,0,0,0.08)`). |
| `Typography` | Standardized text wrappers (`h1`-`h6`, `p`, `span`). | `Public Sans` or `Source Sans Pro`. Enforces the Navy Blue (`#1a4480`) for headers and Base Text (`#1b1b1b`) for body. |
| `ProgressBar` | A horizontal bar indicating percentage or confidence. | Used exclusively for the AI Confidence Bar. Colors shift dynamically: Green (>95%), Yellow (70-94%), Red (<70%). |

---

## 2. Form & Input Elements
These components handle user interaction, keyboard accessibility, and data entry. 

* **`TextInput`:** A standard single-line text field. Must include a distinct `4px` solid blue focus ring when selected via keyboard.
* **`TextArea`:** A multi-line text input primarily used for the AI-suggested or user-modified rejection comments in the Verification Wizard.
* **`Checkbox`:** A standard checkbox used in the Processed View for bulk-selecting rows to export or print.
* **`SelectDropdown`:** A styled dropdown menu for sorting the Queue Grid (e.g., "Easy Wins" vs. "SLA").
* **`FileDropzone`:** A dashed-border container that accepts drag-and-drop file inputs (used for `.zip` bundles in the Bulk Ingestion flow and individual label images in the Manual Entry flow).

---

## 3. Composite Components
These are combinations of atoms and form elements that create reusable, functional blocks across different pages.

* **`DataTable`:** A highly dense, structured table component. 
    * *Features:* Sortable headers, row selection, pagination, and alternating row background colors (Surface Gray `#f0f0f0`). Used in both the Processed and History views.
* **`QueueCard`:** A specialized variant of the `Card` atom for the Queue Grid.
    * *Features:* Includes the App ID, Brand Name, submission date, and the `ProgressBar` for AI confidence at the bottom. Handles complex states like "Opaque/Standard," "Processing" (with spinner overlay), and "Locked" (dark overlay with disabled pointer events).
* **`FilterControlBar`:** A horizontal container holding `SelectDropdown`s and filter pills to manage the Queue Grid view.

---

## 4. Page-Specific Layout Modules
These are the heavy-lifting, highly specialized components unique to the app's core user flows.

### The Verification Wizard (Human-in-the-Loop)
* **`WizardSidebar`:** The left-hand panel (`35vw`) that controls the progressive disclosure of the checklist.
* **`ChecklistItemBox`:** A container that displays the current regulatory requirement (e.g., "Brand Name", "Net Contents").
* **`AIInsightPanel`:** A stylized box within the sidebar that renders the AI's confidence score and its drafted action/comment.
* **`InteractiveImageViewer`:** The critical right-hand panel (`65vw`). This component must accept an image source and an array of coordinates to handle auto-panning and zooming.
* **`BoundingBox`:** An absolute-positioned, semi-transparent overlay (e.g., `border: 2px solid yellow; background: rgba(255, 255, 0, 0.2)`) that lives inside the `InteractiveImageViewer` to highlight text on the physical label.

### The Ingestion Hub
* **`ManifestValidator`:** A list component that renders the parsed `records.csv` during bulk upload. It conditionally renders rows in red if the associated image file is missing, exposing a nested `FileDropzone` to fix the broken link.
* **`Form510031Recreation`:** The manual entry layout styled to map to the cognitive structure of the legacy TTB form.

---

Are there any specific components, like the Interactive Image Viewer or the State Management for the Queue Locks, that you want to detail further before handing this off to your coding agent?
