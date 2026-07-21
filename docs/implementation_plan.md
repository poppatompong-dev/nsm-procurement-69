# Implementation Plan: Enterprise Government Intelligence Platform

## Goal Description
Upgrade the current inspection system into an **Enterprise Government Intelligence Platform** representing the Nakhon Sawan Municipality. The upgrade integrates collaborative features, dynamic state sharing, custom data visualization widgets, an automated analytics insight engine, a smart recommendation queue, and premium visual layout depth with subtle official watermarks (the celestial Vimana).

---

## User Review Required

> [!IMPORTANT]
> **No External Charting Libraries Policy:**
> To ensure the platform loads instantly and compiles cleanly without runtime issues on legacy computers used by government officials, all visual charts (Donut Chart, Line Trend Chart, Horizontal Bar Charts) will be custom-built using HTML5 Canvas or high-performance SVG. This avoids adding massive dependencies like Chart.js or Recharts.
>
> **Sharing URL Size Limits:**
> State sharing is compressed using JSON-to-Base64 serialization. All filter toggles, active tabs, view modes, and inspector details are packed dynamically so copying the link preserves the exact state.

---

## Proposed Changes

We will modify/create the following files in the project workspace:

### 1. State Sharing & Collaboration Component

#### [NEW] [ShareModal.jsx](file:///d:/วัสดุคอม%2049%20รายการ%20200769/src/components/ShareModal.jsx)
Create a premium modal component containing:
*   Copyable compressed URL link.
*   Interactive QR Code generator (rendered dynamically using SVG lines/cells).
*   LINE & Email sharing shortcuts.
*   Snapshot export triggers (Excel/JSON/PDF).

#### [MODIFY] [stateCompressor.js](file:///d:/วัสดุคอม%2049%20รายการ%20200769/src/utils/stateCompressor.js)
Expand state compression to include active Tab (`t`), viewMode (`vm`), sortBy (`sb`), filter options (`q`, `cf`, `df`, `sf`, `nf`, `imf`, `mn`, `mx`), and the selected item ID (`sel`).

---

### 2. Premium Watermark & Visual Depth Layout

#### [MODIFY] [index.css](file:///d:/วัสดุคอม%2049%20รายการ%20200769/src/index.css)
*   Add a subtle transparent Vimana watermark (`bg-watermark-vimana`) using a vector drawing overlay at 3% opacity.
*   Implement visual mesh grids (`bg-grid-mesh`), soft radial lighting gradients, and backdrop-blur glass panels for analytics widgets.

---

### 3. Executive Dashboard & Visual Analytics (Charts)

#### [MODIFY] [Dashboard.jsx](file:///d:/วัสดุคอม%2049%20รายการ%20200769/src/components/Dashboard.jsx)
Enhance the Dashboard component to contain:
*   **Executive Summary Panel:** Overall progress ring, total vs passed vs pending budget metrics, risk indexes (Low/Medium/High), and items requiring immediate attention.
*   **Budget Donut Chart:** SVG-based interactive donut chart showing category distribution with responsive mouse hover highlights.
*   **Inspection Trend Line Chart:** SVG chart indicating inspection frequency over time.
*   **Vendor Distribution Bar Chart:** Horizontal bars highlighting budget/items by supplier.
*   **Evidence completeness bars:** Indicating the checklist and image completion ratios.

---

### 4. Insight & Recommendation Engine

#### [NEW] [InsightEngine.js](file:///d:/วัสดุคอม%2049%20รายการ%20200769/src/utils/InsightEngine.js)
Create a utility that parses current filtered items and automatically generates real-time insights:
*   **Critical (Red):** Duplicate serial numbers, massive pending high-cost items.
*   **Warning (Orange):** Missing serial numbers, incomplete photos.
*   **Recommendation (Blue):** Priority items based on TOR price deviations or category average audit duration.
*   **Information (Green):** Pass rate stats and sharing options.

---

### 5. App State Integration & Filter Syncing

#### [MODIFY] [App.jsx](file:///d:/วัสดุคอม%2049%20รายการ%20200769/src/App.jsx)
*   Integrate URL state restoration on boot to restore active tabs, search query inputs, sorting, and view modes.
*   Add the Share modal trigger overlay.
*   Bind the analytics stats, charts, insights, and recommendations to the state of filters so they update instantly.

---

## Verification Plan

### Automated Tests
*   `npm run build`: To verify all imports, icons, and SVG canvas projections compile without errors.

### Manual Verification
*   **Sharing Test:** Change search query to "หมึก", set Category to "Toner", mark a checklist as false, click "Share View", copy the generated URL, open it in another browser tab, and verify that the exact filter, category, and state are restored.
*   **Chart Responsiveness:** Resize the viewport from mobile to widescreen monitors, ensuring canvas/SVG charts scale smoothly.
*   **Print Verification:** Open report printing (`Ctrl+P`) and verify that all watermarks, background colors, and mesh gradients are automatically hidden, leaving an official clean document.
