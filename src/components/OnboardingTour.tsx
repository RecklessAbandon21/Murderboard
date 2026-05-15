import { useState, useEffect, useCallback } from 'react'

type Side = 'top' | 'bottom' | 'left' | 'right' | 'center'

type TourStep = {
  target: string | null
  extraTargets?: string[]
  title: string
  body: string
  side: Side
}

type TargetRect = { x: number; y: number; width: number; height: number }

type Props = {
  onComplete: () => void
  onSkip: () => void
  onEnterStep?: (index: number) => void
}

const STEPS: TourStep[] = [
  {
    target: null,
    side: 'center',
    title: 'Welcome to Murderboard.',
    body: "This is your infinite canvas. Your work, externalized. No limits, no folders, no pretending this is organized yet. Quick tour, then you’re on your own.",
  },
  {
    target: '[data-tour="dock-add"]',
    side: 'right',
    title: 'Put something on the board.',
    body: "Hit + to drop a task. It’s a sticky note, but without the part where you run out of wall. Drag it wherever your brain says it belongs. That instinct is the system.",
  },
  {
    target: null,
    extraTargets: ['.bulk-add','.bulk-task-modal'],
    side: 'right',
    title: "Or dump everything at once.",
    body: "Click here to bulk add tasks. One line per task. Paste the entire mess: meeting notes, brain dump, the 3am ‘this changes everything’ ideas. It all hits the board at once. Sort it after. Or don’t. At least it’s out of your head and on the board.",
  },
  {
    target: null,
    side: 'center',
    title: "Stop thinking in lists.",
    body: 'Drag tasks anywhere. Cluster what’s related. Push the scary stuff aside. Spread out what matters. The layout IS the system. If it makes sense to you, it’s correct.',
  },
  {
    target: '[data-tour="inspector-done"]',
    extraTargets: ['button[aria-label="Mark task done"]'],
    side: 'left',
    title: 'Now kill something.',
    body: "Mark a task done and it disappears off the board. Gone. Filed away. One less thing staring at you. Turns out progress feels better than organizing.",
  },
  {
    target: null,
    extraTargets: ['.tlui-main-toolbar__inner', '.tlui-style-panel__wrapper'],
    side: 'center',
    title: "Yes, you can draw on it.",
    body: "This isn’t just sticky notes. Sketch, scribble, connect things, make it messy. Diagrams and tasks live together here like they always should have.",
  },
  {
    target: '[data-tour="board-tab-add"]',
    side: 'bottom',
    title: "You’ll need more than one.",
    body: "Hit + in the tabs to make another board. Work. Side project. That idea that shows up in the shower and ruins your peace. Give each one space.",
  },
  {
    target: '[data-tour="search"]',
    side: 'bottom',
    title: 'Lost something?',
    body: "Search highlights tasks on the board instantly. For when you absolutely put something here and then immediately lost it. Happens to everyone.",
  },
  {
    target: '[data-tour="archive-btn"]',
    side: 'bottom',
    title: 'And you get receipts.',
    body: "Every finished task ends up here. Bring it back if needed, or scroll it when you need to feel like you’re actually getting things done.",
  },
  {
    target: null,
    side: 'center',
    title: "That’s it. Go use it.",
    body: "Add tasks. Move them around. Finish them. Repeat. We’ll stay out of your way now, which is more than most tools can say.",
  },
]

const PAD = 12

function getRect(selector: string | null): TargetRect | null {
  if (!selector) return null
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.x, y: r.y, width: r.width, height: r.height }
}

function tooltipPosition(rect: TargetRect, side: Side): React.CSSProperties {
  const gap = PAD + 18
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2

  switch (side) {
    case 'right':
      return { position: 'fixed', left: rect.x + rect.width + gap, top: cy, transform: 'translateY(-50%)' }
    case 'left':
      return { position: 'fixed', right: window.innerWidth - rect.x + gap, top: cy, transform: 'translateY(-50%)' }
    case 'bottom': {
      const left = Math.max(16, Math.min(cx - 150, window.innerWidth - 316))
      return { position: 'fixed', left, top: rect.y + rect.height + gap }
    }
    case 'top': {
      const left = Math.max(16, Math.min(cx - 150, window.innerWidth - 316))
      return { position: 'fixed', left, bottom: window.innerHeight - rect.y + gap }
    }
    default:
      return {}
  }
}

export function OnboardingTour({ onComplete, onSkip, onEnterStep }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<TargetRect | null>(null)
  const [extraRects, setExtraRects] = useState<TargetRect[]>([])
  const [visible, setVisible] = useState(false)

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1
  const isCentered = !step.target || !rect

  const refreshRects = useCallback(() => {
    setRect(getRect(step.target))
    setExtraRects(
      (step.extraTargets ?? []).map(t => getRect(t)).filter(Boolean) as TargetRect[]
    )
  }, [step.target, step.extraTargets])

  useEffect(() => {
    setVisible(false)
    const timer = setTimeout(() => {
      refreshRects()
      setVisible(true)
    }, 80)
    window.addEventListener('resize', refreshRects)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', refreshRects)
    }
  }, [refreshRects])

  const next = useCallback(() => {
    setVisible(false)
    if (isLast) {
      onComplete()
    } else {
      const nextIndex = stepIndex + 1
      setStepIndex(nextIndex)
      onEnterStep?.(nextIndex)
    }
  }, [isLast, onComplete, stepIndex, onEnterStep])

  const allSpotlightRects = [rect, ...extraRects].filter(Boolean) as TargetRect[]

  return (
    <div className={`tour-overlay ${visible ? 'tour-overlay--visible' : ''}`} role="dialog" aria-modal="true" aria-label="Getting started tour">
      {/* Spotlight SVG */}
      {allSpotlightRects.length > 0 ? (
        <svg className="tour-spotlight-svg" aria-hidden="true">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {allSpotlightRects.map((r, i) => (
                <rect key={i} x={r.x - PAD} y={r.y - PAD} width={r.width + PAD * 2} height={r.height + PAD * 2} rx={10} fill="black" />
              ))}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(5,6,10,0.82)" mask="url(#tour-mask)" />
          {allSpotlightRects.map((r, i) => (
            <rect key={i} x={r.x - PAD} y={r.y - PAD} width={r.width + PAD * 2} height={r.height + PAD * 2} rx={10} fill="none" stroke="#ffd84a" strokeWidth={1.5} opacity={0.9} />
          ))}
        </svg>
      ) : (
        <div className="tour-dim" aria-hidden="true" />
      )}

      {/* Tooltip card */}
      <div
        className={`tour-card ${isCentered ? 'tour-card--center' : ''}`}
        style={rect && !isCentered ? tooltipPosition(rect, step.side) : undefined}
      >
        <div className="tour-step-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`tour-dot ${i === stepIndex ? 'tour-dot--active' : i < stepIndex ? 'tour-dot--done' : ''}`} />
          ))}
        </div>

        <h3 className="tour-card-title">{step.title}</h3>
        <p className="tour-card-body">{step.body}</p>

        <div className="tour-card-actions">
          <button className="tour-btn-skip" onClick={onSkip}>
            {isLast ? 'Close' : 'Skip tour'}
          </button>
          <button className="tour-btn-next" onClick={next}>
            {isLast ? "Let's go →" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
