# AlgoVista

An interactive algorithm performance visualizer for Design & Analysis of Algorithms (DAA). Run sorting and searching algorithms, compare execution metrics, and explore complexity through a guided, chart-rich UI.

## Architecture

```
AlgoVista/
├── backend_cpp/      # C++ HTTP server
│   ├── src/
│   │   └── main.cpp       # API endpoints & algorithm implementations
│   └── CMakeLists.txt
├── frontend/         # React + Vite client
│   ├── src/
│   │   ├── App.jsx                   # Main app with dashboard & charts
│   │   ├── components/
│   │   │   └── Background3D.jsx      # Animated 3D background
│   │   ├── styles.css
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Algorithms

| Algorithm       | Type       | Complexity    |
|-----------------|------------|---------------|
| Bubble Sort     | Sorting    | O(n²)         |
| Selection Sort  | Sorting    | O(n²)         |
| Insertion Sort  | Sorting    | O(n²)         |
| Merge Sort      | Sorting    | O(n log n)    |
| Quick Sort      | Sorting    | O(n log n)    |
| Linear Search   | Searching  | O(n)          |
| Binary Search   | Searching  | O(log n)      |

## Setup & Run

### Backend

```bash
cd backend_cpp
cmake -B build && cmake --build build
./build/algovista_backend
```

Requires: CMake ≥ 3.15, C++17 compiler, OpenSSL (for FetchContent).

The server starts on `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### API

```http
POST /run-algorithm
Content-Type: application/json

{
  "algorithm": "merge_sort",
  "data": [5, 2, 9, 1],
  "type": "random",
  "target": null
}
```

Response:

```json
{
  "timeMs": 0.0421,
  "comparisons": 8,
  "sortedData": [1, 2, 5, 9],
  "algorithm": "merge_sort",
  "inputSize": 4,
  "datasetType": "random",
  "steps": [...]
}
```

## Features

- **7 algorithm implementations** with real execution metrics
- **Step-by-step guided workflow** — Intro → Select → Input → Results
- **Performance charts** — execution time comparison, input size vs time, dataset type effects, complexity visualization, algorithm ranking
- **Custom array input** or random dataset generation
- **Search target** support for linear and binary search
- **Animated 3D background** with decorative UI elements

## Tech Stack

**Frontend:** React, Vite, Framer Motion, Chart.js (react-chartjs-2), Tailwind CSS, Lucide Icons, Three.js (@react-three/fiber/drei)

**Backend:** C++17, cpp-httplib, nlohmann/json, CMake
