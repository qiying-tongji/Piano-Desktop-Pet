/**
 * 桌宠主组件
 *
 * 220×220 透明窗内的小钢琴精灵：Framer Motion 悬浮动画、粒子/光晕、双击展开钢琴。
 */
import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { MiniPianoIcon } from './MiniPianoIcon'
import { PetGlow } from './PetGlow'
import { PetParticles } from './PetParticles'
import { usePetAnimation } from '../hooks/usePetAnimation'

export function DesktopPet() {
  const {
    isExpanding,
    isHovered,
    isActive,
    onHoverStart,
    onHoverEnd,
    onClick,
  } = usePetAnimation()

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isExpanding) return
      onClick()
    },
    [isExpanding, onClick],
  )

  const showEffects = isActive || isExpanding

  return (
    <div className="window-drag drag-hitbox relative flex h-full w-full cursor-grab flex-col items-center active:cursor-grabbing">
      <div className="relative flex flex-1 items-center justify-center">
        <motion.div
          aria-hidden
          className="pointer-events-none relative h-[160px] w-[160px] select-none"
          animate={{
            y: isExpanding ? -4 : [0, -7, 0],
            scale: isExpanding ? 1.12 : isHovered ? 1.05 : 1,
            rotate: isExpanding ? [0, -2, 2, 0] : isHovered ? [0, -1.5, 1.5, 0] : 0,
          }}
          transition={{
            y: isExpanding
              ? { duration: 0.5, ease: 'easeOut' }
              : { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
            scale: { type: 'spring', stiffness: 380, damping: 22 },
            rotate: isExpanding
              ? { duration: 0.6 }
              : isHovered
                ? { duration: 5, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.3 },
          }}
        >
          {showEffects && <PetParticles active={showEffects} />}
          {showEffects && (
            <PetGlow active={isHovered} expanding={isExpanding} />
          )}

          <div className="relative z-10 flex h-full flex-col items-center justify-center">
            <motion.div
              animate={{
                scale: isExpanding ? 1.08 : isHovered ? 1.03 : 1,
                filter: isExpanding
                  ? 'drop-shadow(0 0 12px rgba(167,139,250,0.6))'
                  : isHovered
                    ? 'drop-shadow(0 0 8px rgba(167,139,250,0.35))'
                    : 'drop-shadow(0 0 4px rgba(0,0,0,0.25))',
              }}
              transition={{ duration: 0.3 }}
            >
              <MiniPianoIcon active={showEffects} className="h-[88px] w-[88px]" />
            </motion.div>

            {isHovered && !isExpanding && (
              <span className="absolute bottom-1 text-[8px] text-white/30">双击展开</span>
            )}

            {isExpanding && (
              <motion.span
                className="absolute bottom-2 text-[9px] tracking-wider text-pet-accent/80"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                展开中…
              </motion.span>
            )}
          </div>

          {isExpanding && (
            <motion.div
              className="absolute inset-0 rounded-2xl border border-pet-glow/50"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.35, opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />
          )}
        </motion.div>

        {/* no-drag zone aligned to piano icon — double-click to expand */}
        <button
          type="button"
          className="window-no-drag absolute z-20 h-[96px] w-[96px] cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-pet-glow/40"
          aria-label="双击展开钢琴"
          onDoubleClick={handleDoubleClick}
          onMouseEnter={onHoverStart}
          onMouseLeave={onHoverEnd}
        />
      </div>
    </div>
  )
}
