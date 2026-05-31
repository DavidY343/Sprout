import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronLeft, X } from 'lucide-react'

/* ── Types ──────────────────────────────────────────────── */
interface TourStep {
  target?: string        // CSS selector for spotlight element
  title: string
  body: string
  navigateTo?: string    // tab id to switch to
}

interface Props {
  onComplete: () => void
  onNavigate: (tab: string) => void
}

/* ── Steps ──────────────────────────────────────────────── */
const STEPS: TourStep[] = [
  {
    title: '¡Bienvenido a Sprout! 🌱',
    body: 'Te enseñaremos cómo funciona la app paso a paso. Solo tardará unos segundos.',
  },
  {
    target: '[data-tour="settings"]',
    title: '⚙️ Configura tus cuentas',
    body: 'Empieza aquí: crea tus cuentas de inversión (Trade Republic, Degiro, MyInvestor…) y añade tus activos con su ticker de Yahoo Finance.',
  },
  {
    target: '[data-tour="tab-trades"]',
    title: '📈 Registra operaciones',
    body: 'Cada vez que compres o vendas un activo, regístralo aquí. Sprout calculará tu rendimiento automáticamente.',
    navigateTo: 'trades',
  },
  {
    target: '[data-tour="tab-transactions"]',
    title: '💰 Controla tus balances',
    body: 'Depósitos, retiradas, dividendos, comisiones… Así Sprout conocerá tu efectivo real en cada cuenta.',
    navigateTo: 'transactions',
  },
  {
    target: '[data-tour="tab-portfolio"]',
    title: '📊 Tu Dashboard',
    body: 'El centro de control: valor total, rendimientos, gráfico histórico, distribución por activos y un mapa visual de tu cartera.',
    navigateTo: 'portfolio',
  },
  {
    target: '[data-tour="tab-friends"]',
    title: '👥 Comparte con amigos',
    body: 'Añade amigos por email desde Configuración → Amigos. Podrás ver sus carteras en modo lectura y comparar estrategias.',
    navigateTo: 'friends',
  },
  {
    title: '¡Todo listo! 🚀',
    body: 'Ve a ⚙️ Configuración, crea tu primera cuenta y empieza a registrar tus inversiones. ¡Suerte!',
  },
]

const PAD = 10
const GAP = 14
const TOOLTIP_W = 340

/* ── Component ──────────────────────────────────────────── */
export default function OnboardingGuide({ onComplete, onNavigate }: Props) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const current = STEPS[step]
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  /* locate target element */
  const updateRect = useCallback(() => {
    if (!current.target) { setRect(null); return }
    const el = document.querySelector(current.target)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [current.target])

  useEffect(() => {
    if (current.navigateTo) onNavigate(current.navigateTo)
    const t = setTimeout(updateRect, 80)
    window.addEventListener('resize', updateRect)
    return () => { clearTimeout(t); window.removeEventListener('resize', updateRect) }
  }, [step, current.navigateTo, onNavigate, updateRect])

  const finish = () => { onNavigate('portfolio'); onComplete() }
  const next = () => (isLast ? finish() : setStep(s => s + 1))
  const prev = () => setStep(s => Math.max(0, s - 1))

  const hasSpotlight = !!rect && !!current.target

  /* ── Shared UI pieces ── */
  const dots = (
    <div className="flex gap-1.5">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === step ? 'w-6 bg-[var(--accent-blue)]'
            : i < step ? 'w-1.5 bg-[var(--accent-blue)]/40'
            : 'w-1.5 bg-[var(--text-muted)]/20'
          }`}
        />
      ))}
    </div>
  )

  const progressBar = (
    <div className="h-1 bg-[var(--bg-surface-alt)] rounded-t-xl overflow-hidden">
      <div
        className="h-full bg-[var(--accent-blue)] transition-all duration-500 rounded-r"
        style={{ width: `${progress}%` }}
      />
    </div>
  )

  /* ═══════ CENTERED MODAL (welcome / farewell) ═══════ */
  if (!hasSpotlight) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

        <div className="relative w-full max-w-md mx-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden">
          {progressBar}

          <button
            onClick={finish}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-8 pt-10 pb-8 text-center">
            <div className="text-5xl mb-6">{isLast ? '🚀' : '🌱'}</div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{current.title}</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-8">{current.body}</p>
            <div className="flex justify-center mb-6">{dots}</div>

            <div className="flex items-center justify-center gap-3">
              {!isFirst && (
                <button
                  onClick={prev}
                  className="flex items-center gap-0.5 px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center gap-1 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--accent-blue)] hover:opacity-90 transition cursor-pointer"
              >
                {isLast ? '¡Empezar!' : isFirst ? 'Comenzar tour' : 'Siguiente'}
                {!isLast && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {!isLast && (
              <button
                onClick={finish}
                className="mt-4 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition cursor-pointer"
              >
                Saltar guía
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ═══════ SPOTLIGHT MODE ═══════ */
  let tooltipLeft = rect.left + rect.width / 2 - TOOLTIP_W / 2
  tooltipLeft = Math.max(12, Math.min(tooltipLeft, window.innerWidth - TOOLTIP_W - 12))
  const arrowX = rect.left + rect.width / 2 - tooltipLeft

  return (
    <>
      {/* Click blocker */}
      <div className="fixed inset-0 z-[200]" />

      {/* Spotlight hole (box-shadow trick) */}
      <div
        className="fixed z-[201] rounded-xl transition-all duration-300 ease-out pointer-events-none"
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.65), 0 0 30px 4px rgba(59,130,246,0.15)',
          border: '2px solid color-mix(in srgb, var(--accent-blue) 50%, transparent)',
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[202] bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-2xl"
        style={{ top: rect.bottom + PAD + GAP, left: tooltipLeft, width: TOOLTIP_W }}
      >
        {/* Arrow pointing up */}
        <div
          className="absolute -top-[7px] w-3.5 h-3.5 rotate-45 bg-[var(--bg-surface)] border-l border-t border-[var(--border)]"
          style={{ left: arrowX - 7 }}
        />

        {progressBar}

        <div className="relative px-5 pt-4 pb-4">
          <button
            onClick={finish}
            className="absolute top-2 right-2 p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-1 pr-6">{current.title}</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{current.body}</p>
          <div className="mb-3">{dots}</div>

          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={isFirst}
              className="flex items-center gap-0.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-[var(--accent-blue)] hover:opacity-90 transition cursor-pointer"
            >
              {isLast ? '¡Empezar!' : 'Siguiente'}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={finish}
            className="block mx-auto mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition cursor-pointer"
          >
            Saltar guía
          </button>
        </div>
      </div>
    </>
  )
}
