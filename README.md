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
./build/algovista_backend          # default: pinned to core 0
./build/algovista_backend 2        # pin to core 2 instead
```

Requires: CMake ≥ 3.15, C++17 compiler, OpenSSL (for FetchContent).

The server starts on `http://127.0.0.1:8000`.

#### Check CPU Affinity

```bash
# With taskset
taskset -p $(pgrep -f "algovista_backend" | head -1)

# With /proc
cat /proc/$(pgrep -f "algovista_backend" | head -1)/status | grep -i cpus_allowed
```

`Cpus_allowed: 1` means only core 0. `Cpus_allowed: f` or `0-3` means all 4 cores.

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
  "target": null,
  "cpuCore": 0
}
```

| Field      | Type          | Description                               |
|------------|---------------|-------------------------------------------|
| `algorithm`| string        | Algorithm to run                          |
| `data`     | int[]         | Input array                               |
| `type`     | string        | Dataset type (random, sorted, reverse)    |
| `target`   | int \| null   | Search target (null for sorting algos)    |
| `cpuCore`  | int \| null   | CPU core to pin the benchmark to (default 0) |

Response:

```json
{
  "timeMs": 0.0421,
  "comparisons": 8,
  "sortedData": [1, 2, 5, 9],
  "algorithm": "merge_sort",
  "inputSize": 4,
  "datasetType": "random",
  "steps": [...],
  "target": null,
  "foundIndex": null,
  "cpuCore": 0,
  "cpuAffinityEnabled": true,
  "availableCores": 4,
  "threadId": 51077,
  "coreId": 0,
  "peakMemoryKB": 8124,
  "benchmarkTimestamp": "2026-05-31T11:10:08Z"
}
```

| Field               | Type    | Description                              |
|---------------------|---------|------------------------------------------|
| `timeMs`            | double  | Execution time (ms, rounded to 4 places) |
| `comparisons`       | int     | Element comparisons performed            |
| `sortedData`        | int[]   | Result array (truncated to 1000)         |
| `steps`             | int[][] | Visualization snapshots (max 80)         |
| `cpuCore`           | int     | Requested CPU core                       |
| `cpuAffinityEnabled`| bool    | Whether affinity was successfully set    |
| `availableCores`    | int     | Total CPU cores on the system            |
| `threadId`          | long    | OS thread ID that ran the benchmark      |
| `coreId`            | int     | Actual core the thread executed on       |
| `peakMemoryKB`      | long    | Peak resident set size (VmHWM)           |
| `benchmarkTimestamp`| string  | ISO 8601 timestamp of the run            |

## Features

- **7 algorithm implementations** with real execution metrics
- **Step-by-step guided workflow** — Intro → Select → Input → Results
- **Performance charts** — execution time comparison, input size vs time, dataset type effects, complexity visualization, algorithm ranking
- **Custom array input** or random dataset generation
- **Search target** support for linear and binary search
- **CPU affinity pinning** — benchmark threads pinned to a dedicated core via `sched_setaffinity()` for consistent, reproducible measurements
- **Warm-up pass** — each algorithm runs once before timing to reduce cache cold-start effects
- **Benchmark environment metadata** — reports CPU core, thread ID, core ID, peak memory, and timestamp in every response
- **Animated 3D background** with decorative UI elements

## Tech Stack

**Frontend:** React, Vite, Framer Motion, Chart.js (react-chartjs-2), Tailwind CSS, Lucide Icons, Three.js (@react-three/fiber/drei)

**Backend:** C++17, cpp-httplib, nlohmann/json, CMake
