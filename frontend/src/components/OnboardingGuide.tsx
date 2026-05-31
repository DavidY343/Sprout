import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronLeft, X } from 'lucide-react'

/* ── Types ──────────────────────────────────────────────── */
interface TourStep {
  target?: string        // CSS selector for spotlight element
  title: string
  body: string
  navigateTo?: string    // tab id to switch to
  dashboardView?: string // portfolio sub-view to switch to
  position?: 'bottom' | 'top' // tooltip position relative to target
}

interface Props {
  onComplete: () => void
  onNavigate: (tab: string) => void
  onSetView: (view: string) => void
}

/* ── Steps ──────────────────────────────────────────────── */
const STEPS: TourStep[] = [
  {
    title: '¡Bienvenido a Sprout! 🌱',
    body: 'Tu centro de control financiero personal. Te guiaremos paso a paso por toda la app para que no te pierdas nada.',
  },
  {
    target: '[data-tour="settings"]',
    title: '⚙️ Configuración',
    body: 'Lo primero: crea tus cuentas de inversión (Trade Republic, Degiro, MyInvestor…) y añade los activos que tienes con su ticker de Yahoo Finance. Todo empieza aquí.',
  },
  {
    target: '[data-tour="tab-trades"]',
    title: '📈 Operaciones',
    body: 'Registra cada compra y venta de activos. Sprout calculará automáticamente tu precio medio, rendimiento, peso en cartera y beneficio acumulado.',
    navigateTo: 'trades',
  },
  {
    target: '[data-tour="tab-transactions"]',
    title: '💰 Balances',
    body: 'Aquí van los movimientos de dinero: depósitos, retiradas, dividendos y comisiones. Así Sprout conocerá tu efectivo real en cada cuenta.',
    navigateTo: 'transactions',
  },
  {
    target: '[data-tour="tab-portfolio"]',
    title: '📊 Dashboard',
    body: 'El corazón de Sprout. Vamos a explorar sus tres vistas internas…',
    navigateTo: 'portfolio',
  },
  {
    target: '[data-tour="sidebar-toggle"]',
    title: '☰ Menú de vistas',
    body: 'Usa este botón para abrir el menú lateral y cambiar entre las tres vistas del Dashboard: Resumen, Distribución y Mapa.',
    navigateTo: 'portfolio',
    dashboardView: 'resumen',
  },
  {
    target: '[data-tour="view-resumen"]',
    title: '🏠 Vista: Resumen',
    body: 'Tu cuadro de mandos principal. Aquí ves el valor total de tu cartera, rendimientos (1M, 3M, YTD, Total), el gráfico de evolución histórica y una tabla con todos tus activos.',
    navigateTo: 'portfolio',
    dashboardView: 'resumen',
  },
  {
    target: '[data-tour="view-distribucion"]',
    title: '🍩 Vista: Distribución',
    body: 'Dos gráficos de donut interactivos: uno muestra cómo se reparte el capital entre tus cuentas y otro la distribución de activos por tipo, temática o individualmente.',
    navigateTo: 'portfolio',
    dashboardView: 'distribucion',
  },
  {
    target: '[data-tour="view-mapa"]',
    title: '🗺️ Vista: Mapa',
    body: 'Un treemap visual donde el tamaño de cada bloque representa el valor del activo y el color indica su rendimiento. Verde = ganancia, rojo = pérdida. Ideal para ver el panorama completo de un vistazo.',
    navigateTo: 'portfolio',
    dashboardView: 'mapa',
  },
  {
    target: '[data-tour="tab-friends"]',
    title: '👥 Amigos',
    body: 'Añade amigos por email desde Configuración → Amigos. Podrás ver sus carteras en modo solo lectura y comparar estrategias de inversión.',
    navigateTo: 'friends',
  },
  {
    title: '¡Todo listo! 🚀',
    body: 'Ya conoces Sprout. Ve a ⚙️ Configuración, crea tu primera cuenta, añade tus activos y empieza a registrar operaciones. Puedes repetir esta guía en cualquier momento desde Configuración → Preferencias.',
  },
]

const PAD = 10
const GAP = 14
const TOOLTIP_W = 360

/* ── Component ──────────────────────────────────────────── */
export default function OnboardingGuide({ onComplete, onNavigate, onSetView }: Props) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const current = STEPS[step]
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100
  const stepLabel = `${step + 1} / ${STEPS.length}`

  /* locate target element */
  const updateRect = useCallback(() => {
    if (!current.target) { setRect(null); return }
    const el = document.querySelector(current.target)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [current.target])

  useEffect(() => {
    if (current.navigateTo) onNavigate(current.navigateTo)
    if (current.dashboardView) onSetView(current.dashboardView)
    const t = setTimeout(updateRect, 120) // slightly longer for sub-view render
    window.addEventListener('resize', updateRect)
    return () => { clearTimeout(t); window.removeEventListener('resize', updateRect) }
  }, [step, current.navigateTo, current.dashboardView, onNavigate, onSetView, updateRect])

  const finish = () => { onNavigate('portfolio'); onSetView('resumen'); onComplete() }
  const next = () => (isLast ? finish() : setStep(s => s + 1))
  const prev = () => setStep(s => Math.max(0, s - 1))

  const hasSpotlight = !!rect && !!current.target

  /* ── Shared UI pieces ── */
  const dots = (
    <div className="flex gap-1 items-center">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === step ? 'w-5 bg-[var(--accent-blue)]'
            : i < step ? 'w-1.5 bg-[var(--accent-blue)]/40'
            : 'w-1.5 bg-[var(--text-muted)]/20'
          }`}
        />
      ))}
    </div>
  )

  const progressBar = (
    <div className="h-1 bg-[var(--bg-surface-alt)] overflow-hidden">
      <div
        className="h-full bg-[var(--accent-blue)] transition-all duration-500 rounded-r"
        style={{ width: `${progress}%` }}
      />
    </div>
  )

  const navButtons = (size: 'sm' | 'md') => {
    const py = size === 'sm' ? 'py-1.5' : 'py-2.5'
    const px = size === 'sm' ? 'px-3' : 'px-5'
    const textSz = size === 'sm' ? 'text-xs' : 'text-sm'
    const iconSz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
    return (
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          disabled={isFirst}
          className={`flex items-center gap-0.5 ${px} ${py} ${textSz} font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition disabled:opacity-0 disabled:pointer-events-none cursor-pointer`}
        >
          <ChevronLeft className={iconSz} /> Anterior
        </button>
        <span className={`${textSz} text-[var(--text-muted)] tabular-nums`}>{stepLabel}</span>
        <button
          onClick={next}
          className={`flex items-center gap-1 ${px} ${py} rounded-lg ${textSz} font-semibold text-white bg-[var(--accent-blue)] hover:opacity-90 transition cursor-pointer`}
        >
          {isLast ? '¡Empezar!' : 'Siguiente'}
          {!isLast && <ChevronRight className={iconSz} />}
        </button>
      </div>
    )
  }

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
            {navButtons('md')}
          </div>
        </div>
      </div>
    )
  }

  /* ═══════ SPOTLIGHT MODE ═══════ */
  const preferTop = current.position === 'top' || rect.bottom + PAD + GAP + 220 > window.innerHeight
  let tooltipLeft = rect.left + rect.width / 2 - TOOLTIP_W / 2
  tooltipLeft = Math.max(12, Math.min(tooltipLeft, window.innerWidth - TOOLTIP_W - 12))
  const arrowX = Math.min(Math.max(rect.left + rect.width / 2 - tooltipLeft, 20), TOOLTIP_W - 20)

  const tooltipTop = preferTop
    ? rect.top - PAD - GAP - 8  // positioned above, will use transform
    : rect.bottom + PAD + GAP

  return (
    <>
      {/* Click blocker */}
      <div className="fixed inset-0 z-[200]" />

      {/* Spotlight hole */}
      <div
        className="fixed z-[201] rounded-xl transition-all duration-300 ease-out pointer-events-none"
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.65), 0 0 30px 4px rgba(59,130,246,0.12)',
          border: '2px solid color-mix(in srgb, var(--accent-blue) 50%, transparent)',
        }}
      />

      {/* Tooltip */}
      <div
        className={`fixed z-[202] bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden ${preferTop ? '-translate-y-full' : ''}`}
        style={{ top: tooltipTop, left: tooltipLeft, width: TOOLTIP_W }}
      >
        {/* Arrow */}
        {preferTop ? (
          <div
            className="absolute -bottom-[7px] w-3.5 h-3.5 rotate-45 bg-[var(--bg-surface)] border-r border-b border-[var(--border)]"
            style={{ left: arrowX - 7 }}
          />
        ) : (
          <div
            className="absolute -top-[7px] w-3.5 h-3.5 rotate-45 bg-[var(--bg-surface)] border-l border-t border-[var(--border)]"
            style={{ left: arrowX - 7 }}
          />
        )}

        {progressBar}

        <div className="relative px-5 pt-4 pb-4">
          <button
            onClick={finish}
            className="absolute top-2 right-2 p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-1.5 pr-6">{current.title}</h3>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">{current.body}</p>
          <div className="mb-3">{dots}</div>
          {navButtons('sm')}
        </div>
      </div>
    </>
  )
}
