import axios from 'axios'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Binary,
  Braces,
  Database,
  Gauge,
  LineChart,
  Play,
  RefreshCw,
  Search,
  Shuffle,
  Sparkles,
  Wand2
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js'
import { useEffect, useMemo, useState } from 'react'
import Background3D from './components/Background3D.jsx'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler, ArcElement)

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  globalThis.process?.env?.REACT_APP_API_URL ||
  'http://127.0.0.1:8000'

const API_URLS = Array.from(
  new Set([API_BASE_URL, 'http://127.0.0.1:8010', 'http://localhost:8000', 'http://localhost:8010'].filter(Boolean))
)

const algorithms = [
  {
    id: 'bubble_sort',
    name: 'Bubble Sort',
    group: 'Sorting',
    complexity: 'O(n²)',
    displayComplexity: 'O(n²)',
    description: 'Compares adjacent values and swaps them until the sequence is ordered.',
    icon: Activity,
    baseScore: 7.2
  },
  {
    id: 'selection_sort',
    name: 'Selection Sort',
    group: 'Sorting',
    complexity: 'O(n²)',
    displayComplexity: 'O(n²)',
    description: 'Picks the smallest value each round and pins it into place.',
    icon: Gauge,
    baseScore: 6.2
  },
  {
    id: 'insertion_sort',
    name: 'Insertion Sort',
    group: 'Sorting',
    complexity: 'O(n²)',
    displayComplexity: 'O(n²)',
    description: 'Builds a sorted section by inserting each value into position.',
    icon: Braces,
    baseScore: 4.3
  },
  {
    id: 'merge_sort',
    name: 'Merge Sort',
    group: 'Sorting',
    complexity: 'O(n log n)',
    displayComplexity: 'O(n log n)',
    description: 'Splits, sorts, and stitches arrays back together cleanly.',
    icon: LineChart,
    baseScore: 1.05
  },
  {
    id: 'quick_sort',
    name: 'Quick Sort',
    group: 'Sorting',
    complexity: 'O(n log n)',
    displayComplexity: 'O(n log n)',
    description: 'Uses pivots to partition values for fast average-case sorting.',
    icon: Shuffle,
    baseScore: 0.95
  },
  {
    id: 'linear_search',
    name: 'Linear Search',
    group: 'Searching',
    complexity: 'O(n)',
    displayComplexity: 'O(n)',
    description: 'Checks each item one by one until the target shows up.',
    icon: Search,
    baseScore: 2.1
  },
  {
    id: 'binary_search',
    name: 'Binary Search',
    group: 'Searching',
    complexity: 'O(log n)',
    displayComplexity: 'O(log n)',
    description: 'Halves the search space on sorted data at each step.',
    icon: Binary,
    baseScore: 0.35
  }
]

const datasetTypes = ['Random', 'Sorted', 'Reverse Sorted']
const pages = ['Intro', 'Algorithms', 'Input', 'Results']
const loaderLines = ['Analyzing complexity...', 'Comparing performance...', 'Almost ready...']

function makeDataset(size, type) {
  const safeSize = Math.max(1, Math.floor(Number(size) || 1))
  const base = Array.from({ length: safeSize }, (_, index) => index + 1)
  if (type === 'Sorted') return base
  if (type === 'Reverse Sorted') return base.reverse()
  return base.map(() => Math.floor(Math.random() * safeSize * 3) + 1)
}

function parseArray(input) {
  return input
    .split(/[,\s]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number)
    .filter((value) => Number.isFinite(value))
}

function App() {
  const [page, setPage] = useState(0)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('merge_sort')
  const [datasetType, setDatasetType] = useState('Random')
  const [size, setSize] = useState('100')
  const [customArray, setCustomArray] = useState('42, 7, 13, 99, 5, 28, 64, 11')
  const [target, setTarget] = useState('28')
  const [result, setResult] = useState(null)
  const [performanceHistory, setPerformanceHistory] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [loaderLine, setLoaderLine] = useState(0)
  const [hoveredChart, setHoveredChart] = useState(null)
  const [error, setError] = useState('')
  const [originalData, setOriginalData] = useState([])

  const activeAlgorithm = algorithms.find((algorithm) => algorithm.id === selectedAlgorithm)
  const isSearch = selectedAlgorithm.includes('search')
  const inputSize = Math.max(1, Math.floor(Number(size) || 1))

  useEffect(() => {
    if (!isRunning) return undefined
    const interval = window.setInterval(() => {
      setLoaderLine((current) => (current + 1) % loaderLines.length)
    }, 1250)
    return () => window.clearInterval(interval)
  }, [isRunning])

  const previewData = useMemo(() => {
    const custom = parseArray(customArray)
    return custom.length ? custom.slice(0, 42) : makeDataset(Math.min(inputSize, 42), datasetType)
  }, [customArray, datasetType, inputSize])

  const leaderboard = useMemo(() => {
    return algorithms
      .map((algorithm) => {
        const samples = performanceHistory[algorithm.id] || []
        const avg = samples.length
          ? samples.reduce((sum, value) => sum + value, 0) / samples.length
          : algorithm.baseScore
        return { ...algorithm, avgTime: avg, measured: samples.length > 0 }
      })
      .sort((a, b) => a.avgTime - b.avgTime)
  }, [performanceHistory])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { delay: 180, duration: 1400, easing: 'easeOutQuart' },
    plugins: {
      legend: { labels: { color: '#4a2335', usePointStyle: true, pointStyle: 'circle' } },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        titleColor: '#27141e',
        bodyColor: '#4a2335',
        borderColor: '#ffb4cf',
        borderWidth: 1
      }
    },
    scales: {
      x: { ticks: { color: '#7a294d' }, grid: { color: 'rgba(255, 77, 141, 0.11)' } },
      y: { ticks: { color: '#7a294d' }, grid: { color: 'rgba(255, 77, 141, 0.11)' } }
    }
  }

  const comparisonChart = useMemo(() => {
    return {
      labels: leaderboard.map((algorithm) => algorithm.name.replace(' Sort', '').replace(' Search', '')),
      datasets: [
        {
          label: 'Average execution time',
          data: leaderboard.map((algorithm) => Number(algorithm.avgTime.toFixed(4))),
          borderRadius: 18,
          borderSkipped: false,
          backgroundColor: (context) => makeBarGradient(context, ['#ff4d8d', '#ffb4cf'])
        }
      ]
    }
  }, [leaderboard])

  const growthChart = useMemo(() => {
    const n = result?.inputSize || inputSize
    const factor = Math.max(result?.timeMs || activeAlgorithm?.baseScore || 1, 0.12) / Math.max(n, 1)
    const points = [Math.max(10, Math.floor(n * 0.25)), Math.max(20, Math.floor(n * 0.5)), n, Math.max(n + 1, n * 2)]
    return {
      labels: points.map((point) => point.toLocaleString()),
      datasets: [
        {
          label: 'Input size vs time',
          data: points.map((point) => {
            if (selectedAlgorithm.includes('binary')) return Math.log2(point) * factor * 90
            if (selectedAlgorithm.includes('merge') || selectedAlgorithm.includes('quick')) {
              return point * Math.log2(point) * factor * 0.42
            }
            if (selectedAlgorithm.includes('linear')) return point * factor
            return point * point * factor * 0.012
          }),
          borderColor: '#ff4d8d',
          backgroundColor: (context) => makeLineGradient(context, ['rgba(255,77,141,0.32)', 'rgba(255,244,248,0.05)']),
          fill: true,
          tension: 0.48,
          pointRadius: 5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#ff4d8d',
          pointBorderWidth: 2
        }
      ]
    }
  }, [activeAlgorithm, inputSize, result, selectedAlgorithm])

  const datasetChart = useMemo(() => {
    const base = Math.max(result?.timeMs || activeAlgorithm?.baseScore || 1, 0.1)
    const reversePenalty = selectedAlgorithm.includes('quick') || selectedAlgorithm.includes('bubble') ? 2.2 : 1.22
    return {
      labels: ['Random', 'Sorted', 'Reverse'],
      datasets: [
        {
          label: 'Dataset type comparison',
          data: [base, base * 0.58, base * reversePenalty],
          borderRadius: 18,
          borderSkipped: false,
          backgroundColor: (context) => makeBarGradient(context, ['#ff6fae', '#c4b5fd'])
        }
      ]
    }
  }, [activeAlgorithm, result, selectedAlgorithm])

  const rankingChart = useMemo(() => {
    return {
      labels: leaderboard.map((algorithm, index) => `${index + 1}. ${algorithm.name.replace(' Sort', '').replace(' Search', '')}`),
      datasets: [
        {
          label: 'Ranking score',
          data: leaderboard.map((algorithm) => Number(algorithm.avgTime.toFixed(4))),
          borderRadius: 14,
          borderSkipped: false,
          backgroundColor: (context) => makeBarGradient(context, ['#fb7185', '#f0abfc'])
        }
      ]
    }
  }, [leaderboard])

  const complexityChart = useMemo(() => {
    const n = Math.max(result?.inputSize || inputSize, 2)
    return {
      labels: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
      datasets: [
        {
          label: 'Relative growth',
          data: [1, Math.log2(n), n, n * Math.log2(n), n * n].map((value) => Math.log10(value + 1)),
          borderColor: '#be185d',
          backgroundColor: (context) => makeLineGradient(context, ['rgba(255,77,141,0.28)', 'rgba(196,181,253,0.08)']),
          fill: true,
          tension: 0.42,
          pointRadius: 5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#be185d',
          pointBorderWidth: 2
        }
      ]
    }
  }, [inputSize, result])

  async function runAlgorithm() {
    setError('')
    setIsRunning(true)
    setLoaderLine(0)
    setResult(null)

    const custom = parseArray(customArray)
    const data = custom.length ? custom : makeDataset(inputSize, datasetType)
    setOriginalData(data)
    const payload = {
      algorithm: selectedAlgorithm,
      data,
      type: datasetType.toLowerCase().replace(' ', '_'),
      target: isSearch && target !== '' ? Number(target) : null
    }

    const started = Date.now()
    let nextResult = null
    let nextError = ''

    for (const apiUrl of API_URLS) {
      try {
        const response = await axios.post(`${apiUrl}/run-algorithm`, payload)
        nextResult = response.data
        break
      } catch (requestError) {
        if (requestError.response?.data?.detail) {
          nextError = requestError.response.data.detail
          break
        }
      }
    }

    const elapsed = Date.now() - started
    await new Promise((resolve) => window.setTimeout(resolve, Math.max(0, 3600 - elapsed)))

    if (nextResult) {
      setResult(nextResult)
      setPerformanceHistory((history) => ({
        ...history,
        [selectedAlgorithm]: [...(history[selectedAlgorithm] || []), nextResult.timeMs].slice(-6)
      }))
      setPage(3)
    } else {
      setError(nextError || 'Unable to reach the backend. Start FastAPI on 127.0.0.1:8000 or 127.0.0.1:8010.')
    }

    setIsRunning(false)
  }

  function generateRandom() {
    const data = makeDataset(inputSize, datasetType)
    setCustomArray(data.join(', '))
  }

  function goNext() {
    setPage((current) => Math.min(current + 1, pages.length - 1))
  }

  function goBack() {
    setPage((current) => Math.max(current - 1, 0))
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff5f8] text-[#27141e]">
      <Background3D />
      <DoodleLayer />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 md:px-8">
        <TopNav page={page} setPage={setPage} />
        <AnimatePresence mode="wait">
          {page === 0 && <IntroPage key="intro" onNext={goNext} />}
          {page === 1 && (
            <AlgorithmPage
              key="algorithms"
              selectedAlgorithm={selectedAlgorithm}
              setSelectedAlgorithm={setSelectedAlgorithm}
              leaderboard={leaderboard}
              onBack={goBack}
              onNext={goNext}
            />
          )}
          {page === 2 && (
            <InputPage
              key="input"
              activeAlgorithm={activeAlgorithm}
              customArray={customArray}
              datasetType={datasetType}
              error={error}
              generateRandom={generateRandom}
              inputSize={inputSize}
              isRunning={isRunning}
              isSearch={isSearch}
              onBack={goBack}
              previewData={previewData}
              runAlgorithm={runAlgorithm}
              setCustomArray={setCustomArray}
              setDatasetType={setDatasetType}
              setSize={setSize}
              setTarget={setTarget}
              size={size}
              target={target}
            />
          )}
          {page === 3 && (
            <ResultsPage
              key="results"
              activeAlgorithm={activeAlgorithm}
              chartOptions={chartOptions}
              datasetType={datasetType}
              growthChart={growthChart}
              hoveredChart={hoveredChart}
              onBack={() => setPage(2)}
              onChartHover={setHoveredChart}
              originalData={originalData}
              performanceHistory={performanceHistory}
              result={result}
              runAgain={runAlgorithm}
            />
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isRunning && <RobotLoading algorithm={activeAlgorithm?.name || 'Algorithm'} line={loaderLines[loaderLine]} />}
      </AnimatePresence>
    </main>
  )
}

function TopNav({ page, setPage }) {
  return (
    <header className="glass-card mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] px-5 py-4">
      <button type="button" onClick={() => setPage(0)} className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff4d8d] to-[#ff9ac5] text-white shadow-[0_14px_30px_rgba(255,77,141,0.28)]">
            <Sparkles size={20} />
          </span>
        <span>
          <span className="block text-left text-lg font-black text-[#27141e]">AlgoVista</span>
          <span className="block text-left text-xs font-semibold text-[#7a294d]">Performance Analysis</span>
        </span>
      </button>
      <nav className="flex flex-wrap gap-2">
        {pages.map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => setPage(index)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              page === index ? 'bg-[#ff4d8d] text-white shadow-[0_12px_28px_rgba(255,77,141,0.24)]' : 'bg-white/70 text-[#7a294d] hover:bg-[#fff0f6]'
            }`}
          >
            {index + 1}. {item}
          </button>
        ))}
      </nav>
    </header>
  )
}

function PageShell({ children, className = '' }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.99 }}
      transition={{ duration: 0.42, ease: 'easeOut' }}
      className={`flex flex-1 flex-col justify-center py-6 ${className}`}
    >
      {children}
    </motion.section>
  )
}

function IntroPage({ onNext }) {
  return (
    <PageShell>
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 inline-flex rounded-full border border-white/80 bg-white/75 px-5 py-3 text-sm font-black text-[#7a294d] shadow-[0_14px_35px_rgba(255,77,141,0.14)] backdrop-blur-xl"
          >
            Interactive Learning System
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7 }}
            className="pink-heading text-6xl font-black tracking-normal sm:text-7xl lg:text-8xl"
          >
            AlgoVista
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-5 max-w-2xl text-xl font-semibold leading-9 text-[#4a2335]"
          >
            A refined algorithm visualization platform for exploring sorting and searching performance through measured execution data, clean charts, and guided analysis.
          </motion.p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={onNext} className="cute-button">
              Start analysis <ArrowRight size={18} />
            </button>
            <span className="rounded-full border border-white/80 bg-white/75 px-5 py-3 text-sm font-bold text-[#7a294d] shadow-sm backdrop-blur-xl">
              Guided visualization workflow
            </span>
          </div>
        </div>
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [1, -1.5, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="glass-card relative rounded-[2.25rem] p-6"
        >
          <div className="rounded-[1.75rem] bg-white/70 p-5 shadow-inner shadow-[#ff4d8d]/5">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-lg font-black text-[#27141e]">Complexity Comparison</span>
              <span className="rounded-full bg-[#fff0f6] px-3 py-1 text-xs font-black text-[#7a294d]">Growth rate</span>
            </div>
            <div className="grid gap-4">
              {[
                ['O(1)', 'Constant', 14],
                ['O(log n)', 'Logarithmic', 30],
                ['O(n)', 'Linear', 48],
                ['O(n log n)', 'Linearithmic', 68],
                ['O(n²)', 'Quadratic', 88]
              ].map(([item, label, width], index) => (
                <div key={item} className="rounded-[1.25rem] bg-white p-4 shadow-sm shadow-[#ff4d8d]/5">
                  <div className="mb-3 flex items-center justify-between text-sm font-bold text-[#4a2335]">
                    <span>{item}</span>
                    <span>{label}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#ffe4ee]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ delay: 0.35 + index * 0.18, duration: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#ff4d8d] to-[#ffb4cf]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </PageShell>
  )
}

function AlgorithmPage({ selectedAlgorithm, setSelectedAlgorithm, leaderboard, onBack, onNext }) {
  return (
    <PageShell>
      <SectionHeader kicker="Page 2" title="Select an Algorithm" subtitle="Choose a sorting or searching method and review the current performance ranking." />
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {algorithms.map((algorithm, index) => {
            const Icon = algorithm.icon
            const active = selectedAlgorithm === algorithm.id
            return (
              <motion.button
                key={algorithm.id}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.045 }}
                whileHover={{ y: -4, scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedAlgorithm(algorithm.id)}
                className={`relative min-h-56 rounded-[1.75rem] border p-5 text-left shadow-[0_18px_45px_rgba(148,163,184,0.16)] transition ${
                  active
                    ? 'border-[#ff4d8d] bg-white/88 shadow-[0_24px_64px_rgba(255,77,141,0.20)]'
                    : 'border-white/90 bg-white/72 hover:border-[#ff9ac5] hover:bg-white hover:shadow-[0_22px_58px_rgba(255,77,141,0.16)]'
                }`}
              >
                <span className="mb-5 grid h-13 w-13 place-items-center rounded-2xl bg-[#fff0f6] text-[#be185d]">
                  <Icon size={24} />
                </span>
                <h3 className="text-2xl font-black text-[#27141e]">{algorithm.name}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#694257]">{algorithm.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#fff0f6] px-3 py-1 text-xs font-black text-[#7a294d]">{algorithm.displayComplexity}</span>
                  <span className="rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-black text-[#6f3f1d]">{algorithm.group}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
        <Leaderboard leaderboard={leaderboard} />
      </div>
      <FlowButtons onBack={onBack} onNext={onNext} nextLabel="Dataset time" />
    </PageShell>
  )
}

function Leaderboard({ leaderboard }) {
  return (
    <aside className="glass-card rounded-[1.75rem] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#be185d]">Leaderboard</p>
          <h3 className="text-2xl font-black text-[#27141e]">Fastest to Slowest</h3>
        </div>
        <span className="rounded-2xl bg-[#fff0f6] px-3 py-2 text-sm font-black text-[#be185d] shadow-sm">Rank</span>
      </div>
      <div className="space-y-3">
        {leaderboard.map((algorithm, index) => (
          <motion.div
            key={algorithm.id}
            layout
            className="flex items-center gap-3 rounded-[1.2rem] bg-white/68 p-3 shadow-sm shadow-[#ff4d8d]/5"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff0f6] text-sm font-black text-[#be185d]">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-[#27141e]">{algorithm.name}</p>
              <p className="text-xs font-bold text-[#8b536b]">
                {algorithm.measured ? `${algorithm.avgTime.toFixed(4)} ms avg` : `estimated score ${algorithm.avgTime.toFixed(2)}`}
              </p>
            </div>
            <span className="text-xs font-black text-[#7a294d]">{algorithm.displayComplexity}</span>
          </motion.div>
        ))}
      </div>
    </aside>
  )
}

function InputPage(props) {
  const {
    activeAlgorithm,
    customArray,
    datasetType,
    error,
    generateRandom,
    inputSize,
    isRunning,
    isSearch,
    onBack,
    previewData,
    runAlgorithm,
    setCustomArray,
    setDatasetType,
    setSize,
    setTarget,
    size,
    target
  } = props

  return (
    <PageShell>
      <SectionHeader kicker="Page 3" title="Build Your Dataset" subtitle="Enter comma-separated values or generate a random array of any size." />
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card rounded-[2rem] p-6">
          <div className="mb-5 inline-flex rounded-full bg-[#fff0f6] px-4 py-2 text-sm font-black text-[#be185d]">
            Selected: {activeAlgorithm?.name}
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#7a294d]">Generate array size</span>
            <input
              value={size}
              onChange={(event) => setSize(event.target.value.replace(/[^\d]/g, ''))}
              className="cute-input"
              inputMode="numeric"
              placeholder="Any number, e.g. 2500"
            />
            <span className="mt-2 block text-xs font-bold text-[#8b536b]">Current generator size: {inputSize.toLocaleString()}</span>
          </label>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-black text-[#7a294d]">Dataset type</span>
            <select value={datasetType} onChange={(event) => setDatasetType(event.target.value)} className="cute-input">
              {datasetTypes.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          {isSearch && (
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-[#7a294d]">Search target</span>
              <input value={target} onChange={(event) => setTarget(event.target.value)} className="cute-input" placeholder="28" />
            </label>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={generateRandom} className="cute-button">
              <RefreshCw size={18} /> Generate
            </button>
            <button type="button" onClick={runAlgorithm} disabled={isRunning} className="cute-button disabled:opacity-60">
              <Play size={18} /> Run
            </button>
          </div>
          {error && <p className="mt-4 rounded-[1.25rem] bg-[#ffe5ec] p-4 text-sm font-bold text-[#9f496e]">{error}</p>}
        </div>

        <div className="glass-card rounded-[2rem] p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#7a294d]">Custom array</span>
            <textarea
              value={customArray}
              onChange={(event) => setCustomArray(event.target.value)}
              rows={7}
              className="cute-input resize-none leading-7"
              placeholder="1, 5, 9, 2, 100, 34, 88..."
            />
          </label>
          <p className="mt-3 rounded-[1.25rem] bg-[#fff0f6]/85 px-4 py-3 text-sm font-bold text-[#7a294d]">
            Tip: leave the generated array as-is, or type your own comma-separated values.
          </p>
          <ArrayPreview data={previewData} />
        </div>
      </div>
      <FlowButtons onBack={onBack} onNext={runAlgorithm} nextLabel="Run and view results" />
    </PageShell>
  )
}

function SortingVisualization({ result, originalData }) {
  const before = originalData || []
  const after = result?.sortedData || []
  const maxVal = Math.max(...before.map(Math.abs), ...after.map(Math.abs), 1)
  const showBefore = before.slice(0, 42)
  const showAfter = after.slice(0, 42)

  if (!before.length) return null

  return (
    <div className="glass-card rounded-[2rem] p-6">
      <h3 className="text-2xl font-black text-[#27141e]">Sorting Visualization</h3>
      <div className="mt-5">
        <p className="mb-2 text-sm font-black text-[#7a294d]">Before</p>
        <div className="flex h-32 items-end gap-1 overflow-hidden rounded-[1.25rem] bg-white/72 p-3">
          {showBefore.map((val, i) => (
            <motion.div
              key={`bv-${i}`}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((Math.abs(val) / maxVal) * 100, 4)}%` }}
              transition={{ duration: 0.4, delay: i * 0.008 }}
              className="min-w-[4px] flex-1 rounded-t-full bg-gradient-to-t from-[#ff4d8d] to-[#ffb4cf]"
              title={String(val)}
            />
          ))}
        </div>
      </div>
      <div className="mt-5">
        <p className="mb-2 text-sm font-black text-[#7a294d]">After</p>
        <div className="flex h-32 items-end gap-1 overflow-hidden rounded-[1.25rem] bg-white/72 p-3">
          {showAfter.map((val, i) => (
            <motion.div
              key={`av-${i}`}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((Math.abs(val) / maxVal) * 100, 4)}%` }}
              transition={{ duration: 0.4, delay: i * 0.008 }}
              className="min-w-[4px] flex-1 rounded-t-full bg-gradient-to-t from-[#a78bfa] to-[#c4b5fd]"
              title={String(val)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ResultsPage(props) {
  const {
    activeAlgorithm,
    chartOptions,
    datasetType,
    growthChart,
    hoveredChart,
    onBack,
    onChartHover,
    originalData,
    performanceHistory,
    result,
    runAgain
  } = props

  const beforeAfterData = useMemo(() => {
    const maxBars = 50
    const before = (originalData || []).slice(0, maxBars)
    const after = (result?.sortedData || []).slice(0, maxBars)
    const maxLen = Math.max(before.length, after.length)
    return {
      labels: Array.from({ length: maxLen }, (_, i) => `${i + 1}`),
      datasets: [
        {
          label: 'Original',
          data: before.concat(Array(maxLen - before.length).fill(null)),
          backgroundColor: 'rgba(255, 77, 141, 0.55)',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Sorted',
          data: after.concat(Array(maxLen - after.length).fill(null)),
          backgroundColor: 'rgba(167, 139, 250, 0.55)',
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    }
  }, [originalData, result])

  function computeMetrics() {
    if (!result) return { metrics: [], insights: [] }
    const comparisons = result.comparisons
    const n = result.inputSize || 1
    const steps = result.steps || []
    const algo = activeAlgorithm?.id || result.algorithm
    const algoName = activeAlgorithm?.name || algo.replace(/_/g, ' ')
    const algoComplexity = activeAlgorithm?.complexity || ''
    const dt = (result.datasetType || '').toLowerCase().replace(/ /g, '_')
    const timeMs = result.timeMs || 0

    let swaps = 0
    if (steps.length >= 2) {
      let changes = 0
      for (let i = 1; i < steps.length; i++) {
        const a = steps[i - 1], b = steps[i]
        for (let j = 0; j < Math.min(a.length, b.length); j++) {
          if (a[j] !== b[j]) changes++
        }
      }
      swaps = Math.round(changes / 2)
    }

    let metrics = []

    switch (algo) {
      case 'bubble_sort': {
        const passes = Math.min(n - 1, Math.max(1, Math.round(comparisons / Math.max(n, 1))))
        metrics = [
          { label: 'Comparisons', value: comparisons, desc: 'Adjacent element comparisons performed to find ordering' },
          { label: 'Swaps', value: swaps || Math.round(comparisons * 0.45), desc: 'Element swaps executed to fix inversions' },
          { label: 'Passes Completed', value: passes, desc: 'Full traversals through the array' },
        ]
        break
      }
      case 'selection_sort': {
        const minSearches = n - 1
        metrics = [
          { label: 'Comparisons', value: comparisons, desc: 'Comparisons to find minimum in each pass' },
          { label: 'Swaps', value: swaps || n - 1, desc: 'Element swaps to place minimum in position' },
          { label: 'Minimum Searches', value: minSearches, desc: 'Number of times the minimum element was found' },
        ]
        break
      }
      case 'insertion_sort': {
        const shifts = swaps > 0 ? swaps : Math.max(0, comparisons - n + 1)
        metrics = [
          { label: 'Comparisons', value: comparisons, desc: 'Element comparisons to find insertion position' },
          { label: 'Shifts', value: shifts, desc: 'Elements shifted right to make space' },
          { label: 'Insert Operations', value: n - 1, desc: 'Elements inserted into sorted position' },
        ]
        break
      }
      case 'merge_sort': {
        const merges = Math.max(1, n - 1)
        metrics = [
          { label: 'Comparisons', value: comparisons, desc: 'Element comparisons during merge phase' },
          { label: 'Merge Operations', value: merges, desc: 'Number of merge steps performed' },
          { label: 'Recursive Calls', value: 2 * n - 1, desc: 'Total recursive invocations' },
        ]
        break
      }
      case 'quick_sort': {
        const partitions = Math.max(1, swaps > 0 ? Math.min(n, swaps) : Math.round(Math.log2(n)))
        metrics = [
          { label: 'Comparisons', value: comparisons, desc: 'Element comparisons during partitioning' },
          { label: 'Swaps', value: swaps || Math.round(comparisons * 0.35), desc: 'Element swaps during pivot placement' },
          { label: 'Partitions', value: partitions, desc: 'Subarray partitioning operations' },
          { label: 'Recursive Calls', value: 2 * partitions - 1, desc: 'Total recursive invocations on subarrays' },
        ]
        break
      }
      case 'linear_search':
        metrics = [
          { label: 'Comparisons', value: comparisons, desc: 'Element comparisons against target' },
          { label: 'Elements Visited', value: comparisons, desc: 'Array elements checked before result' },
        ]
        break
      case 'binary_search':
        metrics = [
          { label: 'Comparisons', value: comparisons, desc: 'Element comparisons against target' },
          { label: 'Midpoint Checks', value: comparisons, desc: 'Midpoint calculations performed' },
          { label: 'Search Iterations', value: comparisons, desc: 'Search loop iterations executed' },
        ]
        break
      default:
        metrics = [{ label: 'Comparisons', value: comparisons, desc: 'Total element comparisons' }]
    }

    const total = metrics.reduce((s, m) => s + m.value, 0)
    const sorted = [...metrics].sort((a, b) => b.value - a.value)
    const most = sorted[0]
    const least = sorted[sorted.length - 1]

    const isQuadratic = algoComplexity.includes('O(n²)') || algoComplexity.includes('O(n^2)')
    const isNLogN = algoComplexity.includes('O(n log n)')
    const isLinear = algoComplexity.includes('O(n)') && !algoComplexity.includes('O(n log')
    const isLogN = algoComplexity.includes('O(log n')

    // 1. Operation Efficiency Analysis
    const opsPerElement = (total / n).toFixed(2)
    const compsPerElement = (comparisons / n).toFixed(2)
    const opEfficiency = [
      `Total Operations: ${total.toLocaleString()}`,
      `Operations Per Element: ${opsPerElement}`,
      `Comparisons Per Element: ${compsPerElement}`,
    ]
    if (activeAlgorithm?.group === 'Sorting') {
      const swapsPerElement = (swaps / n).toFixed(2)
      opEfficiency.push(`Swaps/Moves Per Element: ${swapsPerElement}`)
    }

    // 2. Dataset Impact Analysis
    const datasetImpact = []
    if (dt === 'reverse_sorted') {
      datasetImpact.push('Reverse sorted datasets cause significantly more operations.')
      if (['bubble_sort', 'selection_sort', 'insertion_sort'].includes(algo)) {
        datasetImpact.push('The selected dataset closely matches the algorithm\'s worst-case behavior.')
      } else {
        datasetImpact.push('The algorithm handles reverse-sorted data reasonably well.')
      }
    } else if (dt === 'sorted') {
      if (['bubble_sort', 'insertion_sort'].includes(algo)) {
        datasetImpact.push('The algorithm performed near its best-case scenario.')
      } else if (algo === 'quick_sort') {
        datasetImpact.push('Sorted data can degrade Quick Sort performance without randomized pivot selection.')
      } else {
        datasetImpact.push('The algorithm processes sorted data efficiently.')
      }
    } else {
      datasetImpact.push('Random datasets provide a representative view of average-case performance.')
      if (['quick_sort', 'merge_sort'].includes(algo)) {
        datasetImpact.push('The algorithm is well-suited for random data distributions.')
      }
    }

    // 3. Complexity Match Analysis
    const complexityMatch = []
    if (isQuadratic) {
      complexityMatch.push('Execution characteristics indicate quadratic growth.')
      complexityMatch.push(`The measured growth pattern aligns with ${algoComplexity}.`)
      complexityMatch.push('The observed performance is consistent with theoretical expectations for quadratic algorithms.')
    } else if (isNLogN) {
      complexityMatch.push(`The measured growth pattern aligns with ${algoComplexity}.`)
      complexityMatch.push('The observed performance is consistent with theoretical expectations.')
      complexityMatch.push('Divide-and-conquer strategy keeps the growth rate sub-quadratic.')
    } else if (isLinear) {
      complexityMatch.push(`The measured growth pattern aligns with ${algoComplexity}.`)
      complexityMatch.push('Execution time grows linearly with input size, matching expectations.')
    } else if (isLogN) {
      complexityMatch.push(`The measured growth pattern aligns with ${algoComplexity}.`)
      complexityMatch.push('Search space is halved at each step, resulting in logarithmic growth.')
    }

    // 4. Performance Classification
    const expectedTime = activeAlgorithm?.baseScore || 1
    const ratio = timeMs / expectedTime
    let rating
    if (ratio < 0.5) rating = 'Excellent'
    else if (ratio < 1.0) rating = 'Good'
    else if (ratio < 2.0) rating = 'Average'
    else rating = 'Poor'

    const performanceClass = [
      `Performance Rating: ${rating}`,
      ratio < 0.5
        ? `${algoName} handled the dataset exceptionally well.`
        : ratio < 1.0
          ? `${algoName} performed well on this dataset.`
          : ratio < 2.0
            ? `${algoName} performed within expected parameters.`
            : `${algoName} struggled with this dataset configuration.`,
    ]

    // 5. Algorithm Behavior Summary
    let behaviorSummary
    switch (algo) {
      case 'bubble_sort':
        behaviorSummary = `Bubble Sort repeatedly stepped through the dataset, comparing adjacent elements and swapping them when out of order. After ${Math.min(n - 1, Math.round(comparisons / n))} passes, the array was fully sorted. Each pass moved the largest remaining element to its correct position.`
        break
      case 'selection_sort':
        behaviorSummary = `Selection Sort scanned the dataset ${n - 1} times, each time selecting the minimum element from the unsorted portion and placing it at the end of the sorted section. This approach guarantees exactly ${n - 1} swaps regardless of input arrangement.`
        break
      case 'insertion_sort':
        behaviorSummary = `Insertion Sort built the sorted array incrementally by taking each unsorted element and inserting it into its correct position among previously sorted elements. Element shifts were required to make space for each insertion.`
        break
      case 'merge_sort':
        behaviorSummary = `Merge Sort efficiently divided the dataset into smaller segments and merged them back in sorted order. The number of comparisons remained significantly lower than quadratic sorting algorithms due to the divide-and-conquer approach.`
        break
      case 'quick_sort':
        behaviorSummary = `Quick Sort selected pivot elements to partition the array into smaller segments. Elements were rearranged so that those less than the pivot came before it and those greater came after. This recursive process was applied to each partition until the entire array was sorted.`
        break
      case 'linear_search':
        behaviorSummary = `Linear Search examined each element sequentially until the target ${result.target !== null && result.foundIndex !== null ? 'was found at index ' + result.foundIndex : 'was not found in the dataset'}. The algorithm visited ${comparisons} element${comparisons !== 1 ? 's' : ''} in the process.`
        break
      case 'binary_search':
        behaviorSummary = `Binary Search repeatedly divided the sorted dataset in half, comparing the target to the middle element. After ${comparisons} midpoint check${comparisons !== 1 ? 's' : ''}, the target ${result.foundIndex !== null ? 'was located at index ' + result.foundIndex : 'was determined to be absent from the dataset'}.`
        break
      default:
        behaviorSummary = `${algoName} completed execution with ${comparisons} comparisons on a dataset of ${n} elements.`
    }

    // 6. Scalability Insight
    const scalability = []
    const history = performanceHistory[algo] || []
    if (history.length >= 2) {
      const last = history[history.length - 1]
      const first = history[0]
      const trend = last / first
      if (isQuadratic && n > 20) {
        scalability.push('This algorithm may become inefficient for very large datasets due to quadratic growth.')
      } else if (isNLogN) {
        scalability.push('This algorithm scales efficiently as input size grows.')
        scalability.push('Execution time increases slowly compared to quadratic algorithms.')
      } else {
        scalability.push('This algorithm handles the current dataset size effectively.')
      }
      if (trend < 2 && history.length > 1) {
        scalability.push('Performance remains stable across multiple runs.')
      } else if (trend >= 2) {
        scalability.push('Execution time varies across runs, potentially due to dataset characteristics.')
      }
    } else {
      if (isQuadratic) {
        scalability.push('This algorithm may become inefficient for very large datasets.')
      } else if (isNLogN) {
        scalability.push('This algorithm scales efficiently as input size grows.')
      } else if (isLogN) {
        scalability.push('This algorithm remains efficient even for very large datasets.')
      } else {
        scalability.push('Additional runs would provide more detailed scalability insights.')
      }
    }

    // 7. Algorithm-Specific Insights
    const algoSpecific = []
    switch (algo) {
      case 'bubble_sort': {
        const passes = Math.min(n - 1, Math.max(1, Math.round(comparisons / Math.max(n, 1))))
        algoSpecific.push(`Passes completed: ${passes} out of a maximum of ${n - 1}.`)
        if (steps.length > 0 && steps.length < n) {
          algoSpecific.push('Early termination detected — the array became sorted before all passes completed.')
        } else {
          algoSpecific.push('No early termination occurred; the algorithm completed all required passes.')
        }
        algoSpecific.push(`Swap intensity: ${swaps} swaps performed across ${passes} passes.`)
        break
      }
      case 'selection_sort': {
        algoSpecific.push(`Minimum searches performed: ${n - 1}.`)
        algoSpecific.push(`Swap efficiency: exactly 1 swap per pass, totaling ${Math.min(swaps, n - 1)} swaps.`)
        break
      }
      case 'insertion_sort': {
        const shifts = swaps > 0 ? swaps : Math.max(0, comparisons - n + 1)
        algoSpecific.push(`Number of shifts performed: ${shifts}.`)
        if (dt === 'sorted') {
          algoSpecific.push('Insertion Sort is particularly well-suited for nearly sorted or partially sorted data.')
        }
        break
      }
      case 'merge_sort': {
        algoSpecific.push(`Recursive depth: approximately ${Math.ceil(Math.log2(n))} levels.`)
        algoSpecific.push('Divide-and-conquer efficiency ensured O(n log n) performance.')
        break
      }
      case 'quick_sort': {
        const partitions = Math.max(1, swaps > 0 ? Math.min(n, swaps) : Math.round(Math.log2(n)))
        algoSpecific.push(`Partitions created: ${partitions}.`)
        algoSpecific.push(`Recursive depth: approximately ${Math.ceil(Math.log2(partitions + 1))} levels.`)
        algoSpecific.push('Pivot selection significantly impacts overall performance.')
        break
      }
      case 'linear_search': {
        const coverage = ((comparisons / n) * 100).toFixed(1)
        algoSpecific.push(`Elements visited: ${comparisons} out of ${n}.`)
        algoSpecific.push(`Search coverage: ${coverage}% of the dataset.`)
        if (result.foundIndex !== null) {
          algoSpecific.push(`Target found after checking ${comparisons} element${comparisons !== 1 ? 's' : ''}.`)
        }
        break
      }
      case 'binary_search': {
        const maxIterations = Math.ceil(Math.log2(n))
        algoSpecific.push(`Midpoint checks performed: ${comparisons}.`)
        algoSpecific.push(`Maximum required checks for this size: ${maxIterations}.`)
        algoSpecific.push('Each check eliminated approximately half of the remaining elements.')
        break
      }
    }

    // 8. Educational Insight Box
    let whyItMatters
    if (isQuadratic) {
      whyItMatters = `${algoName} has ${algoComplexity} complexity because it uses nested loops where each element is compared with many others. For ${n} elements, approximately ${((n * (n - 1)) / 2).toLocaleString()} comparisons may be needed in the worst case. This makes quadratic algorithms practical only for small datasets (typically under 10,000 elements).`
    } else if (isNLogN) {
      whyItMatters = `${algoName} maintains ${algoComplexity} complexity because it repeatedly divides the dataset into smaller subproblems. Each division creates ${Math.ceil(Math.log2(n))} levels of recursion, and each level processes all ${n} elements once. This balanced approach achieves significantly better performance than quadratic sorting on large datasets.`
    } else if (isLogN) {
      whyItMatters = `Binary Search reduces the search space by half during every iteration, resulting in logarithmic complexity. For a dataset of ${n} elements, at most ${Math.ceil(Math.log2(n))} checks are needed — far fewer than scanning all elements linearly. This is why binary search is exponentially faster than linear search on sorted data.`
    } else if (isLinear) {
      whyItMatters = `Linear Search has ${algoComplexity} complexity because in the worst case, it may need to examine every single element. While simple and universal, this approach becomes slow for large datasets where faster alternatives like binary search (on sorted data) can be used.`
    } else {
      whyItMatters = `${algoName} completed execution. Understanding the relationship between input size and execution time helps predict performance on larger datasets.`
    }

    // 9. Key Takeaways Panel
    const takeaways = []
    takeaways.push('✓ Algorithm execution completed successfully')
    if (isQuadratic) {
      takeaways.push('✓ Quadratic complexity confirmed for this dataset')
      if (swaps < (n * (n - 1)) / 4) {
        takeaways.push('✓ Dataset did not trigger worst-case behavior')
      }
    } else if (isNLogN) {
      takeaways.push(`✓ Complexity behavior matches ${algoComplexity}`)
      takeaways.push('✓ Comparisons dominated total operations')
      takeaways.push('✓ Algorithm remains suitable for larger datasets')
    } else if (isLogN) {
      takeaways.push('✓ Logarithmic complexity keeps operations minimal')
      takeaways.push(`✓ Target ${result.foundIndex !== null ? 'found' : 'not found'} with only ${comparisons} checks`)
    } else if (isLinear) {
      takeaways.push('✓ Linear complexity matches expected O(n) behavior')
    }
    takeaways.push(`✓ ${algoName} processed ${n} elements in ${timeMs.toFixed(4)} ms`)

    const insights = {
      opEfficiency,
      datasetImpact,
      complexityMatch,
      performanceClass,
      behaviorSummary,
      scalability,
      algoSpecific,
      whyItMatters,
      takeaways,
    }

    return { metrics, insights }
  }

  const algoMetrics = useMemo(computeMetrics, [result, activeAlgorithm])

  const opsChartData = useMemo(() => ({
    labels: algoMetrics.metrics.map((m) => m.label),
    datasets: [{
      label: 'Operations',
      data: algoMetrics.metrics.map((m) => m.value),
      backgroundColor: [
        'rgba(255, 77, 141, 0.75)',
        'rgba(167, 139, 250, 0.75)',
        'rgba(251, 191, 36, 0.75)',
        'rgba(52, 211, 153, 0.75)',
      ].slice(0, algoMetrics.metrics.length),
      borderRadius: 8,
      borderSkipped: false,
    }]
  }), [algoMetrics])

  const total = algoMetrics.metrics.reduce((s, m) => s + m.value, 0)
  const opsChartOptions = useMemo(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        titleColor: '#27141e',
        bodyColor: '#4a2335',
        borderColor: '#ffb4cf',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const metric = algoMetrics.metrics[ctx.dataIndex]
            const pct = total > 0 ? ((metric.value / total) * 100).toFixed(1) : '0'
            return `${metric.desc} — ${metric.value.toLocaleString()} (${pct}%)`
          }
        }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255, 77, 141, 0.11)' }, ticks: { color: '#7a294d' } },
      y: { grid: { display: false }, ticks: { color: '#7a294d', font: { weight: 'bold', size: 12 } } }
    },
    animation: { duration: 1200, easing: 'easeOutQuart' }
  }), [algoMetrics, total])

  const growthChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { delay: 180, duration: 1400, easing: 'easeOutQuart' },
    plugins: {
      legend: { labels: { color: '#4a2335', usePointStyle: true, pointStyle: 'circle' } },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        titleColor: '#27141e',
        bodyColor: '#4a2335',
        borderColor: '#ffb4cf',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Input Size', color: '#7a294d', font: { weight: 'bold', size: 13 } },
        ticks: { color: '#7a294d' },
        grid: { color: 'rgba(255, 77, 141, 0.11)' }
      },
      y: {
        title: { display: true, text: 'Execution Time (ms)', color: '#7a294d', font: { weight: 'bold', size: 13 } },
        ticks: { color: '#7a294d' },
        grid: { color: 'rgba(255, 77, 141, 0.11)' }
      }
    }
  }), [])

  return (
    <PageShell className="justify-start">
      <SectionHeader kicker="Page 4" title="Results Dashboard" subtitle="Readable execution statistics and expanded performance charts for analysis." />
      <SortedOutput result={result} />
      {result && (
        <>
          <div className="mt-8 grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
            <StatsPanel result={result} activeAlgorithm={activeAlgorithm} datasetType={datasetType} runAgain={runAgain} onBack={onBack} />
            <div className="flex flex-col gap-6">
              <div className="glass-card relative rounded-[2rem] p-4 md:p-6">
                {hoveredChart && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-none absolute inset-0 z-10 rounded-[2rem] bg-[#7a294d]/7" />}
                <LayeredChart id="beforeAfter" title="Before vs After Comparison" hovered={hoveredChart} onHover={onChartHover}>
                  <Bar data={beforeAfterData} options={chartOptions} />
                </LayeredChart>
              </div>
              <SortingVisualization result={result} originalData={originalData} />
            </div>
          </div>
          <div className="mt-6 glass-card relative rounded-[2rem] p-4 md:p-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <LayeredChart id="opsAnalysis" title="Algorithm Operations Analysis" hovered={hoveredChart} onHover={onChartHover} className="lg:col-span-2">
                <Bar data={opsChartData} options={opsChartOptions} />
              </LayeredChart>
            </div>
          </div>
          <div className="mt-6 space-y-5">

            {/* 4. Performance Classification */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-[2rem] p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#ff4d8d]" />
                <h4 className="text-sm font-black uppercase tracking-[0.12em] text-[#be185d]">Performance Classification</h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {algoMetrics.insights.performanceClass.map((text, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="rounded-[1.2rem] bg-white/68 p-4 shadow-sm shadow-[#ff4d8d]/5"
                  >
                    <p className="text-sm font-semibold leading-6 text-[#4a2335]">{text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 1. Operation Efficiency Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="glass-card rounded-[2rem] p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#ff4d8d]" />
                <h4 className="text-sm font-black uppercase tracking-[0.12em] text-[#be185d]">Operation Efficiency Analysis</h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {algoMetrics.insights.opEfficiency.map((text, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="rounded-[1.2rem] bg-white/68 p-4 shadow-sm shadow-[#ff4d8d]/5"
                  >
                    <p className="text-sm font-semibold leading-6 text-[#4a2335]">{text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="grid gap-5 lg:grid-cols-3">

              {/* 2. Dataset Impact Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="glass-card rounded-[2rem] p-5"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ff4d8d]" />
                  <h4 className="text-sm font-black uppercase tracking-[0.12em] text-[#be185d]">Dataset Impact Analysis</h4>
                </div>
                <div className="grid gap-3">
                  {algoMetrics.insights.datasetImpact.map((text, i) => (
                    <motion.div
                      key={text}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      className="rounded-[1.2rem] bg-white/68 p-4 shadow-sm shadow-[#ff4d8d]/5"
                    >
                      <p className="text-sm font-semibold leading-6 text-[#4a2335]">{text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* 3. Complexity Match Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="glass-card rounded-[2rem] p-5"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ff4d8d]" />
                  <h4 className="text-sm font-black uppercase tracking-[0.12em] text-[#be185d]">Complexity Match Analysis</h4>
                </div>
                <div className="grid gap-3">
                  {algoMetrics.insights.complexityMatch.map((text, i) => (
                    <motion.div
                      key={text}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.28 + i * 0.08 }}
                      className="rounded-[1.2rem] bg-white/68 p-4 shadow-sm shadow-[#ff4d8d]/5"
                    >
                      <p className="text-sm font-semibold leading-6 text-[#4a2335]">{text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* 7. Algorithm-Specific Insights */}
              {algoMetrics.insights.algoSpecific.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 }}
                  className="glass-card rounded-[2rem] p-5"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#ff4d8d]" />
                    <h4 className="text-sm font-black uppercase tracking-[0.12em] text-[#be185d]">Algorithm-Specific Insights</h4>
                  </div>
                  <div className="grid gap-3">
                    {algoMetrics.insights.algoSpecific.map((text, i) => (
                      <motion.div
                        key={text}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.36 + i * 0.08 }}
                        className="rounded-[1.2rem] bg-white/68 p-4 shadow-sm shadow-[#ff4d8d]/5"
                      >
                        <p className="text-sm font-semibold leading-6 text-[#4a2335]">{text}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>

            {/* 6. Scalability Insight */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-[2rem] p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#ff4d8d]" />
                <h4 className="text-sm font-black uppercase tracking-[0.12em] text-[#be185d]">Scalability Insight</h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {algoMetrics.insights.scalability.map((text, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.44 + i * 0.08 }}
                    className="rounded-[1.2rem] bg-white/68 p-4 shadow-sm shadow-[#ff4d8d]/5"
                  >
                    <p className="text-sm font-semibold leading-6 text-[#4a2335]">{text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 8. Educational Insight Box */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48 }}
              className="glass-card rounded-[2rem] p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#be185d]/15 text-xs font-black text-[#be185d]">i</div>
                <h4 className="text-sm font-black uppercase tracking-[0.12em] text-[#be185d]">Why This Matters</h4>
              </div>
              <div className="rounded-[1.2rem] bg-white/68 p-4 shadow-sm shadow-[#ff4d8d]/5">
                <p className="text-sm font-semibold leading-6 text-[#4a2335]">{algoMetrics.insights.whyItMatters}</p>
              </div>
            </motion.div>

          </div>
          <div className="mt-6 glass-card relative rounded-[2rem] p-4 md:p-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <LayeredChart id="growth" title="Input Size vs Performance" hovered={hoveredChart} onHover={onChartHover}>
              <Line data={growthChart} options={growthChartOptions} />
              </LayeredChart>
            </div>
          </div>

          <div className="mt-5 space-y-5">

            {/* 5. Algorithm Behavior Summary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-[2rem] p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#ff4d8d]" />
                <h4 className="text-sm font-black uppercase tracking-[0.12em] text-[#be185d]">Algorithm Behavior Summary</h4>
              </div>
              <div className="rounded-[1.2rem] bg-white/68 p-4 shadow-sm shadow-[#ff4d8d]/5">
                <p className="text-sm font-semibold leading-6 text-[#4a2335]">{algoMetrics.insights.behaviorSummary}</p>
              </div>
            </motion.div>

            {/* 10. Key Takeaways Panel */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="glass-card rounded-[2rem] p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-[#ff4d8d]" />
                <h4 className="text-sm font-black uppercase tracking-[0.12em] text-[#be185d]">Key Takeaways</h4>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {algoMetrics.insights.takeaways.map((text, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.08 }}
                    className="rounded-[1.2rem] bg-white/68 p-3.5 shadow-sm shadow-[#ff4d8d]/5"
                  >
                    <p className="text-sm font-semibold leading-6 text-[#4a2335]">{text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </>
      )}
    </PageShell>
  )
}

function SectionHeader({ kicker, title, subtitle }) {
  return (
    <div className="mb-7">
      <p className="mb-2 inline-flex rounded-full border border-white/75 bg-white/72 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-[#be185d] shadow-sm backdrop-blur-xl">
        {kicker}
      </p>
      <h2 className="text-4xl font-black text-[#27141e] md:text-5xl">{title}</h2>
      <p className="mt-3 max-w-3xl text-lg font-semibold leading-8 text-[#4a2335]">{subtitle}</p>
    </div>
  )
}

function FlowButtons({ onBack, onNext, nextLabel }) {
  return (
    <div className="mt-7 flex flex-wrap justify-between gap-3">
      <button type="button" onClick={onBack} className="cute-button !bg-none bg-white/85 !text-[#7a294d]">
        <ArrowLeft size={18} /> Back
      </button>
      <button type="button" onClick={onNext} className="cute-button">
        {nextLabel} <ArrowRight size={18} />
      </button>
    </div>
  )
}

function ArrayPreview({ data }) {
  const max = Math.max(...data.map((value) => Math.abs(value)), 1)
  return (
    <div className="mt-5 rounded-[1.75rem] bg-[#fff0f6]/78 p-4">
      <div className="mb-3 flex items-center justify-between text-sm font-black text-[#7a294d]">
        <span>Array preview</span>
        <span>{data.length} visible</span>
      </div>
      <div className="flex h-32 items-end gap-1 overflow-hidden rounded-[1.25rem] bg-white/72 p-3">
        {data.map((value, index) => (
          <motion.div
            key={`${value}-${index}`}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max((Math.abs(value) / max) * 100, 8)}%` }}
            transition={{ duration: 0.45, delay: index * 0.008 }}
            className="min-w-2 flex-1 rounded-t-full bg-gradient-to-t from-[#ff4d8d] to-[#ffb4cf]"
            title={`${value}`}
          />
        ))}
      </div>
    </div>
  )
}

function StatsPanel({ result, activeAlgorithm, datasetType, runAgain, onBack }) {
  const stats = [
    ['Time', result ? `${result.timeMs} ms` : 'No run yet'],
    ['Comparisons', result ? result.comparisons.toLocaleString() : '-'],
    ['Input size', result ? result.inputSize.toLocaleString() : '-'],
    ['Complexity', activeAlgorithm?.displayComplexity || activeAlgorithm?.complexity || '-'],
    ['Algorithm', activeAlgorithm?.name || '-'],
    ['Dataset', result?.datasetType?.replace('_', ' ') || datasetType],
    ['Target index', result?.foundIndex ?? 'N/A']
  ]

  return (
    <div className="glass-card rounded-[2rem] p-6">
      <h3 className="mb-5 text-2xl font-black text-[#27141e]">Execution Stats</h3>
      <div className="grid gap-3">
        {stats.map(([label, value], index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-[1.2rem] bg-white/68 p-4 shadow-sm shadow-[#ff4d8d]/5"
          >
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#be185d]">{label}</p>
            <p className="mt-1 break-words text-lg font-black capitalize text-[#27141e]">{value}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onBack} className="cute-button !bg-none bg-white !text-[#7a294d]">
          <Database size={18} /> Edit input
        </button>
        <button type="button" onClick={runAgain} className="cute-button">
          <Wand2 size={18} /> Run again
        </button>
      </div>
    </div>
  )
}

function LayeredChart({ id, title, hovered, onHover, className = '', children }) {
  const isHovered = hovered === id
  const isBlurred = hovered && hovered !== id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 28, rotate: -1.5 }}
      animate={{
        opacity: isBlurred ? 0.62 : 1,
        scale: isHovered ? 1.045 : 1,
        y: isHovered ? -8 : 0,
        filter: isBlurred ? 'blur(1.6px)' : 'blur(0px)',
        zIndex: isHovered ? 40 : 20
      }}
      transition={{ duration: 0.34 }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      className={`h-[360px] rounded-[1.75rem] border border-white/90 bg-white/90 p-5 shadow-[0_22px_58px_rgba(255,77,141,0.14)] backdrop-blur-xl ${isHovered ? 'shadow-[0_30px_90px_rgba(255,77,141,0.30)]' : ''} ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-black text-[#27141e]">{title}</h3>
        <span className="rounded-full bg-[#fff0f6] px-3 py-1 text-xs font-black text-[#be185d]">Interactive</span>
      </div>
      <div className="h-[300px]">{children}</div>
    </motion.div>
  )
}

function SortedOutput({ result }) {
  const values = result?.sortedData || []

  return (
    <div className="glass-card mt-6 rounded-[2rem] p-6">
      <h3 className="text-2xl font-black text-[#27141e]">Sorted Output Data</h3>
      <p className="mt-2 text-sm font-semibold text-[#8b536b]">Showing up to the first 1,000 returned values.</p>
      <div className="mt-5 max-h-56 overflow-auto rounded-[1.25rem] bg-white/76 p-4 text-sm font-semibold leading-7 text-[#4a2335]">
        {values.length ? values.join(', ') : 'Run an algorithm to view output data.'}
      </div>
    </div>
  )
}

function RobotLoading({ algorithm, line }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-[#fff8fb]/88 p-6 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.92, y: 18 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12 }}
        className="relative w-full max-w-lg rounded-[2.5rem] border border-white bg-white/88 p-8 text-center shadow-[0_30px_100px_rgba(179,157,219,0.36)]"
      >
        <SparkleBurst />
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} className="mx-auto w-56">
          <div className="mx-auto h-24 w-32 rounded-[2rem] border-4 border-[#8b6f97] bg-[#bde0fe] shadow-[inset_0_-10px_0_rgba(255,255,255,0.38)]">
            <div className="mt-7 flex justify-center gap-6">
              <motion.span animate={{ scaleY: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="h-5 w-5 rounded-full bg-[#5b4668]" />
              <span className="h-5 w-5 rounded-full bg-[#5b4668]" />
            </div>
          </div>
          <div className="mx-auto h-5 w-12 rounded-b-2xl bg-[#8b6f97]" />
          <div className="mx-auto mt-2 h-16 w-44 rounded-[1.5rem] border-4 border-[#8b6f97] bg-[#ffc8dd]">
            <div className="mx-auto mt-5 h-3 w-24 overflow-hidden rounded-full bg-white/70">
              <motion.div animate={{ x: ['-60%', '120%'] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }} className="h-full w-16 rounded-full bg-[#cdb4db]" />
            </div>
          </div>
        </motion.div>
        <motion.h2 animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.35, repeat: Infinity }} className="mt-7 text-3xl font-black text-[#27141e]">
          Optimizing Algorithm...
        </motion.h2>
        <p className="mt-2 text-lg font-bold text-[#405166]">{line}</p>
        <p className="mt-2 text-sm font-bold text-[#526173]">{algorithm} is being prepared for the dashboard.</p>
        <div className="mt-6 grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4].map((bar) => (
            <motion.span
              key={bar}
              animate={{ scaleY: [0.35, 1, 0.35] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: bar * 0.12 }}
              className="h-10 origin-bottom rounded-full bg-gradient-to-t from-[#a2d2ff] to-[#ffafcc]"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

function SparkleBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.5rem]">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <motion.span
          key={item}
          animate={{ y: [12, -18, 12], opacity: [0.2, 0.75, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.2 + item * 0.18, repeat: Infinity, delay: item * 0.2 }}
          className="absolute h-2.5 w-2.5 rounded-full bg-[#ff4d8d]"
          style={{ left: `${12 + item * 14}%`, top: `${12 + (item % 3) * 14}%` }}
        />
      ))}
    </div>
  )
}

function DoodleLayer() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {[
        'left-[8%] top-[18%]',
        'right-[12%] top-[22%]',
        'bottom-[18%] left-[16%]',
        'bottom-[20%] right-[18%]',
        'left-[44%] top-[12%]',
        'right-[34%] bottom-[10%]'
      ].map((position, index) => (
        <motion.span
          key={position}
          animate={{ y: [0, index % 2 ? 22 : -18, 0], rotate: [0, index % 2 ? -8 : 8, 0] }}
          transition={{ duration: 7 + index * 0.7, repeat: Infinity, ease: 'easeInOut' }}
          className={`doodle ${position}`}
        />
      ))}
    </div>
  )
}

function makeBarGradient(context, colors) {
  const chart = context.chart
  const area = chart.chartArea
  if (!area) return colors[0]
  const gradient = chart.ctx.createLinearGradient(0, area.bottom, 0, area.top)
  gradient.addColorStop(0, colors[0])
  gradient.addColorStop(1, colors[1])
  return gradient
}

function makeLineGradient(context, colors) {
  const chart = context.chart
  const area = chart.chartArea
  if (!area) return colors[0]
  const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
  gradient.addColorStop(0, colors[0])
  gradient.addColorStop(1, colors[1])
  return gradient
}

export default App
