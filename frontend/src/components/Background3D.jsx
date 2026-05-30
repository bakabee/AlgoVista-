import { motion } from 'framer-motion'

const blobs = [
  { className: 'left-[4%] top-[6%] h-80 w-80 bg-[#ff4d8d]', duration: 22, x: 36, y: -30, opacity: 'opacity-24' },
  { className: 'right-[5%] top-[10%] h-96 w-96 bg-[#ff9ac5]', duration: 26, x: -38, y: 28, opacity: 'opacity-28' },
  { className: 'bottom-[2%] left-[16%] h-72 w-72 bg-[#c4b5fd]', duration: 28, x: 42, y: 22, opacity: 'opacity-24' },
  { className: 'bottom-[8%] right-[16%] h-80 w-80 bg-[#fb7185]', duration: 24, x: -30, y: -34, opacity: 'opacity-22' },
  { className: 'left-[38%] top-[2%] h-64 w-64 bg-[#ffd1dc]', duration: 30, x: 22, y: 42, opacity: 'opacity-34' },
  { className: 'right-[34%] bottom-[6%] h-72 w-72 bg-[#fed7aa]', duration: 32, x: -32, y: -24, opacity: 'opacity-26' },
  { className: 'left-[1%] bottom-[30%] h-56 w-56 bg-[#f0abfc]', duration: 27, x: 30, y: 26, opacity: 'opacity-18' },
  { className: 'right-[1%] bottom-[36%] h-60 w-60 bg-[#ff6fae]', duration: 31, x: -26, y: 34, opacity: 'opacity-20' },
  { className: 'left-[52%] top-[36%] h-44 w-44 bg-[#ff4d8d]', duration: 34, x: -20, y: 18, opacity: 'opacity-12' },
  { className: 'left-[24%] top-[54%] h-52 w-52 bg-[#fbcfe8]', duration: 29, x: 24, y: -18, opacity: 'opacity-30' }
]

const notes = [
  { text: 'O(n log n)', className: 'left-[12%] top-[36%] rotate-[-4deg] bg-white/68', duration: 13 },
  { text: 'sort()', className: 'right-[16%] top-[42%] rotate-[4deg] bg-white/66', duration: 14 },
  { text: 'time ms', className: 'left-[58%] bottom-[18%] rotate-[-3deg] bg-white/64', duration: 15 },
  { text: 'compare', className: 'right-[28%] top-[18%] rotate-[3deg] bg-white/58', duration: 16 },
  { text: 'rank', className: 'left-[30%] bottom-[10%] rotate-[2deg] bg-white/58', duration: 17 },
  { text: 'visualize', className: 'left-[66%] top-[9%] rotate-[-2deg] bg-white/55', duration: 18 },
  { text: 'metrics', className: 'left-[8%] bottom-[44%] rotate-[3deg] bg-white/52', duration: 19 }
]

const particles = [
  'left-[18%] top-[24%]',
  'left-[46%] top-[18%]',
  'right-[22%] top-[30%]',
  'left-[7%] bottom-[16%]',
  'right-[9%] bottom-[20%]',
  'left-[70%] bottom-[34%]',
  'left-[36%] top-[62%]',
  'right-[42%] top-[8%]',
  'left-[54%] bottom-[6%]',
  'right-[4%] top-[58%]'
]

function Background3D() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[linear-gradient(135deg,#fff5f8_0%,#fff0f6_34%,#fff8f2_62%,#f8f3ff_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_30%,rgba(255,77,141,0.18),transparent_24%),radial-gradient(circle_at_18%_12%,rgba(255,111,174,0.30),transparent_28%),radial-gradient(circle_at_80%_14%,rgba(244,114,182,0.28),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(196,181,253,0.24),transparent_38%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.52),transparent_34%)]" />
      {blobs.map((blob) => (
        <motion.div
          key={blob.className}
          animate={{ x: [0, blob.x, 0], y: [0, blob.y, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: blob.duration, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute rounded-full blur-3xl ${blob.opacity} ${blob.className}`}
        />
      ))}
      {notes.map((note, index) => (
        <motion.div
          key={note.text}
          animate={{ y: [0, index % 2 ? 18 : -18, 0], rotate: [0, index % 2 ? -3 : 3, 0] }}
          transition={{ duration: note.duration, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute hidden rounded-[1.25rem] border border-white/80 px-5 py-3 text-sm font-black text-[#7a294d] shadow-[0_18px_45px_rgba(255,77,141,0.12)] backdrop-blur-xl md:block ${note.className}`}
        >
          {note.text}
        </motion.div>
      ))}
      {particles.map((particle, index) => (
        <motion.div
          key={particle}
          animate={{ y: [0, index % 2 ? 26 : -26, 0], x: [0, index % 3 ? 14 : -14, 0], opacity: [0.16, 0.52, 0.16] }}
          transition={{ duration: 11 + index * 0.8, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute h-2.5 w-2.5 rounded-full bg-[#ff4d8d]/35 shadow-[0_0_20px_rgba(255,77,141,0.35)] ${particle}`}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:46px_46px] opacity-30" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#7a294d_0.8px,transparent_0.8px)] [background-size:18px_18px]" />
    </div>
  )
}

export default Background3D
