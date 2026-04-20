### Modern TTB.gov (USWDS) UI Style Guide for AI Coding Agents

**Agent Instruction:** Please style the user interface using the modern U.S. Web Design System (USWDS) guidelines. The goal is to build a clean, highly accessible, and authoritative government web application. Do not use legacy 90s/00s web styling.

#### 1. Color Palette (Strictly Modern)
* **Primary Action Blue:** `#005ea2` (Use for primary buttons, active links, and main headers).
* **Deep Navy:** `#1a4480` (Use for text headings, footers, and strong contrast elements).
* **Background White:** `#ffffff` (Primary application background).
* **Surface Gray:** `#f0f0f0` (Use for alternating table rows, disabled states, and the Right Panel context viewer in the wizard).
* **Border Gray:** `#dfe1e2` (Use for dividing lines and subtle card borders).
* **Base Text:** `#1b1b1b` (Standard body text; do not use pure black `#000000` to reduce eye strain).

**Status & Feedback Colors:**
* **Success (Pass/High Confidence):** `#00a91c` (Backgrounds) or `#00a91c` (Text/Icons).
* **Warning (Mid Confidence):** `#ffbe2e` (Backgrounds) or `#b25c00` (Text/Icons).
* **Error/Danger (Fail/Low Confidence):** `#d83933` (Backgrounds) or `#b50909` (Text/Icons).

#### 2. Typography
* **Font Family:** `Public Sans, Source Sans Pro, Helvetica Neue, Arial, sans-serif`. (Public Sans is the official USWDS font).
* **Headings:** Bold, colored in Deep Navy (`#1a4480`), with a line-height of `1.2`.
* **Body Text:** `16px` base size, `1.5` line-height.
* **UI Elements (Tables, Badges):** `14px` to maximize data density, particularly in the Queue Grid and Processed View.

#### 3. Component Styling Directives
* **Buttons:** Flat design, no gradients, `4px` border radius. 
    * *Primary:* Blue background, white text.
    * *Secondary/Outline:* White background, Blue border (`2px solid #005ea2`), Blue text.
* **Form Inputs:** Slightly rounded (`4px` border radius), solid gray border (`1px solid #565c65`), and a white background.
* **Accessibility (Mandatory Focus States):** All interactive elements (inputs, buttons, queue cards) *must* have a distinct focus ring when navigated via keyboard. Use `outline: 4px solid #2491ff; outline-offset: 2px;`.
* **Cards (Queue Grid):** White background, `1px` Border Gray outline, and a subtle drop shadow (`box-shadow: 0 2px 4px rgba(0,0,0,0.08)`). On hover or focus, increase the drop shadow slightly and change the border to Primary Action Blue.

#### 4. Layout Architecture
* **Container Width:** Maximize readability by capping main views (Ingestion, Queue, Processed) at `max-width: 1440px`, centered on the screen with `margin: 0 auto`.
* **Wizard Split-Screen:** Use CSS Flexbox. 
    * `flex: 0 0 35%` for the left checklist panel (White background, `padding: 2rem`, right border).
    * `flex: 1` for the right image viewer (Surface Gray background to make the label pop). 
* **Visual Hierarchy:** Use horizontal rules (`<hr>`) styled as `border-top: 1px solid #dfe1e2` to separate major sections, rather than heavy blocks of color.
