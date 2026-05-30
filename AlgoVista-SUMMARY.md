# AlgoVista — Algorithm Performance Visualizer

> A stateless single-page React + FastAPI application for interactively exploring the performance of 5 sorting and 2 searching algorithms.

---

## Tech Stack

| Layer     | Technology                                               |
| --------- | -------------------------------------------------------- |
| Frontend  | React 19, Vite, Tailwind CSS 3, Framer Motion 12         |
| Charts    | Chart.js 4 + react-chartjs-2                             |
| Icons     | Lucide React                                              |
| Backend   | Python 3.12+, FastAPI, Uvicorn                            |
| Database  | None (fully stateless, all data in-memory on frontend)   |

---

## Algorithms (7 total)

| # | Algorithm       | Type      | Complexity  |
| - | --------------- | --------- | ----------- |
| 1 | Bubble Sort     | Sorting   | O(n²)       |
| 2 | Selection Sort  | Sorting   | O(n²)       |
| 3 | Insertion Sort  | Sorting   | O(n²)       |
| 4 | Merge Sort      | Sorting   | O(n log n)  |
| 5 | Quick Sort      | Sorting   | O(n log n)  |
| 6 | Linear Search   | Searching | O(n)        |
| 7 | Binary Search   | Searching | O(log n)    |

---

## Page 1 — Intro

- **Badge:** "Interactive Learning System"
- **Title:** AlgoVista
- **Subtitle:** Tagline describing the platform
- **Preview card:** Complexity comparison with 5 animated bars:
  O(1) 14% · O(log n) 30% · O(n) 48% · O(n log n) 68% · O(n²) 88%
- **Button:** "Start analysis" → navigates to Page 2

---

## Page 2 — Algorithms

### Left: 7 Algorithm Cards

Each card shows an icon, name, one-line description, and tags for complexity + group. Clicking selects the algorithm (pink highlight).

### Right: Leaderboard

Ranks all 7 algorithms fastest-to-slowest. Shows **measured average** in ms if you've run them this session, otherwise an **estimated score** from a base baseline.

### Navigation

- **Back** → Page 1
- **"Dataset time"** → Page 3

---

## Page 3 — Input

### Left Column — Dataset Configuration

| Control              | Details                                                  |
| -------------------- | -------------------------------------------------------- |
| Array Size           | Numeric input, only digits allowed. Default: `100`       |
| Dataset Type         | Dropdown: Random / Sorted / Reverse Sorted               |
| Search Target        | Shows only for search algorithms. Default: `28`          |
| **Generate** button  | Fills the custom array textarea with fresh random data   |
| **Run** button       | Sends request to backend                                 |

### Right Column — Custom Array

- **Textarea:** Free-form comma/space-separated integers
- **Default value:** `42, 7, 13, 99, 5, 28, 64, 11`
- **Array Preview:** Mini bar chart showing up to 42 bars, heights proportional to values

**Priority:** If textarea has values, those are used. Otherwise generates via size + type.

### API Calls

Frontend tries URLs in order until one responds:
1. `http://127.0.0.1:8000`
2. `http://127.0.0.1:8010`
3. `http://localhost:8000`
4. `http://localhost:8010`

### Loading Overlay

Full-screen animated robot with blinking eyes, moving arms, progress bar, spinning sparkles, and rotating status messages ("Analyzing complexity..." → "Comparing performance..." → "Almost ready..."). Minimum display: 3.6 seconds.

---

## Page 4 — Results Dashboard

### Left: Stats Panel

| Stat          | Source                                  |
| ------------- | --------------------------------------- |
| Time          | `result.timeMs` + " ms"                 |
| Comparisons   | `result.comparisons` (comma-formatted)  |
| Input size    | `result.inputSize` (comma-formatted)    |
| Algorithm     | Active algorithm name                   |
| Dataset       | Dataset type (underscores → spaces)     |
| Target index  | `result.foundIndex` or "N/A"            |

**Buttons:** "Edit input" → back to Page 2 · "Run again" → re-runs.

### Right: 5 Interactive Charts

All charts have hover effects — hovered chart scales up, others blur.

| Chart                              | Type | Description                                                          |
| ---------------------------------- | ---- | -------------------------------------------------------------------- |
| Execution Time Comparison          | Bar  | All 7 algorithms side-by-side in ms                                  |
| Input Size vs Performance          | Line | Simulated scaling across 4 input sizes (25%, 50%, 100%, 200%)        |
| Algorithm Ranking                  | Bar  | Ranked 1-7 by average time                                           |
| Dataset Type Performance           | Bar  | Random vs Sorted vs Reverse Sorted                                   |
| Complexity Visualization           | Line | O(1) · O(log n) · O(n) · O(n log n) · O(n²) growth comparison       |

### Below: Sorted Output

Scrollable box showing the result array (truncated to first 1,000 values).

---

## API — `POST /run-algorithm`

### Request
```json
{
  "algorithm": "merge_sort",
  "data": [5, 2, 9, 1],
  "type": "random",
  "target": null
}
```

### Response
```json
{
  "timeMs": 0.0421,
  "comparisons": 8,
  "sortedData": [1, 2, 5, 9],
  "algorithm": "merge_sort",
  "inputSize": 4,
  "datasetType": "random",
  "target": null,
  "foundIndex": null,
  "steps": [[5,2,9,1], [2,5,9,1], ...]
}
```

### Health Check
```
GET http://127.0.0.1:8000/  →  {"status": "AlgoVista backend running"}
```

---

## Backend Algorithm Details

| Algorithm      | Notes                                                              |
| -------------- | ------------------------------------------------------------------ |
| Bubble Sort    | Stops early if no swaps made in a pass (`swapped` flag)            |
| Selection Sort | Finds minimum per pass, swaps into place                           |
| Insertion Sort | Builds sorted section left-to-right                                |
| Merge Sort     | Recursive divide & conquer, captures steps after each merge         |
| Quick Sort     | Median-of-three pivot, sorts smaller partition first (tail-call)   |
| Linear Search  | Returns index of first match, or null                              |
| Binary Search  | Sorts data first, then halves search space                         |

All sorting algorithms capture up to 80 intermediate array states (only for arrays ≤ 80 elements).

---

## Key Frontend State

| State               | Type     | Purpose                                |
| ------------------- | -------- | -------------------------------------- |
| `page`              | number   | Current page (0-3)                     |
| `selectedAlgorithm` | string   | Active algorithm ID                    |
| `datasetType`       | string   | Random / Sorted / Reverse Sorted       |
| `size`              | string   | Array size input value                 |
| `customArray`       | string   | Custom array textarea content          |
| `target`            | string   | Search target value                    |
| `result`            | object   | Last backend response                  |
| `performanceHistory`| object   | Map of algorithm ID → array of timeMs  |
| `isRunning`         | boolean  | Loading state                          |
| `error`             | string   | Error message                          |

**Note:** All state is in-memory only. Refreshing the page resets everything.

---

## Project Files

```
DAA/
├── README.md
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx              # React entry point
│       ├── App.jsx               # Entire app (1004 lines)
│       ├── styles.css            # Tailwind + custom classes
│       └── components/
│           └── Background3D.jsx  # Animated background blobs
├── backend/
│   ├── requirements.txt
│   ├── main.py                   # FastAPI server (258 lines)
│   └── start_server.py           # Auto-port launcher (8000/8010)
└── AlgoVista-SUMMARY.md          # This file
```
