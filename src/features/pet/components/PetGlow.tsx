import { motion } from 'framer-motion'

interface PetGlowProps {
  active?: boolean
  expanding?: boolean
}

/** Glow only shown on hover / expand — idle pet stays clean. */
export function PetGlow({ active = false, expanding = false }: PetGlowProps) {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        animate={{
          opacity: expanding ? 0.85 : 0.65,
          scale: expanding ? 1.12 : 1.04,
        }}
        transition={{ duration: 0.35 }}
        style={{
          background:
            'radial-gradient(circle at 50% 55%, rgba(167,139,250,0.28) 0%, rgba(167,139,250,0.06) 45%, transparent 70%)',
        }}
        aria-hidden
      />
      {active && (
        <motion.div
          className="pointer-events-none absolute inset-1 rounded-xl"
          animate={{
            boxShadow: expanding
              ? '0 0 28px rgba(167,139,250,0.5)'
              : '0 0 18px rgba(167,139,250,0.35)',
          }}
          transition={{ duration: 0.35 }}
          aria-hidden
        />
      )}
    </>
  )
}
