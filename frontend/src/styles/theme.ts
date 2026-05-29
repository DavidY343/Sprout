/**
 * Sprout Design System — Le Corbusier Edition
 * 
 * Uses CSS custom properties (--var) for light/dark theming.
 * See index.css for the variable definitions.
 */

// ═══════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════

export const layout = {
  pageStack: 'space-y-6',
  gridKpi3: 'grid grid-cols-1 md:grid-cols-3 gap-5',
  gridKpi4: 'grid grid-cols-2 md:grid-cols-4 gap-4',
  grid2: 'grid grid-cols-1 md:grid-cols-2 gap-5',
  gridForm4: 'grid grid-cols-1 md:grid-cols-4 gap-4',
  gridForm3: 'grid grid-cols-1 md:grid-cols-3 gap-3',
} as const

// ═══════════════════════════════════════════
// SURFACES
// ═══════════════════════════════════════════

export const surface = {
  heroPanel: 'relative rounded-2xl p-8 bg-[var(--bg-surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden',
  card: 'rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]',
  cardSm: 'rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-4 shadow-[var(--shadow-sm)]',
  tableContainer: 'rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden shadow-[var(--shadow-sm)]',
  creatorPanel: 'bg-[var(--bg-surface-alt)] border border-[var(--border)] rounded-lg p-4 space-y-3',
  tooltip: 'bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-4 shadow-[var(--shadow-md)] min-w-[220px]',
} as const

// ═══════════════════════════════════════════
// GLOW EFFECTS (removed — clean surfaces)
// ═══════════════════════════════════════════

export const glow = {
  orbTop: 'hidden',
  orbBottom: 'hidden',
} as const

// ═══════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════

export const text = {
  pageTitle: 'text-3xl font-bold mb-2 text-[var(--text-primary)]',
  pageSubtitle: 'text-[var(--text-muted)]',
  sectionTitle: 'text-xl font-semibold text-[var(--text-primary)]',
  sectionDesc: 'text-sm text-[var(--text-muted)]',
  fieldLabel: 'block text-sm font-medium text-[var(--text-secondary)] mb-2',
  kpiLabel: 'text-sm text-[var(--text-muted)] mb-1',
  creatorTitle: 'text-lg font-medium text-[var(--text-primary)]',
} as const

// ═══════════════════════════════════════════
// FORMS & INPUTS
// ═══════════════════════════════════════════

export const input = {
  base: 'w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--border-focus)] transition',
  select: 'w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg px-4 py-2 text-[var(--text-primary)]',
  glass: 'w-full px-4 py-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--border-focus)] transition',
  number: 'w-full bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg p-2 text-[var(--text-primary)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
  filter: 'bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-2 rounded-lg border border-[var(--border-input)]',
} as const

// ═══════════════════════════════════════════
// BUTTONS
// ═══════════════════════════════════════════

export const button = {
  primary: 'w-full py-3 px-4 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--text-on-dark)] font-medium hover:bg-[var(--btn-primary-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  secondary: 'px-4 py-2 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] rounded-lg text-[var(--text-primary)] disabled:opacity-50 cursor-pointer',
  success: 'px-4 py-2 bg-[var(--accent-green)] hover:opacity-90 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  danger: 'flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--accent-red)]/30 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/5 transition text-sm font-medium cursor-pointer',
  outline: 'flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)]/10 hover:bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30 rounded-lg transition-all hover:border-[var(--accent-blue)]/50 text-[var(--accent-blue)] cursor-pointer',
  pillActive: 'px-4 py-2 text-sm font-medium rounded-md bg-[var(--btn-primary-bg)] text-[var(--text-on-dark)]',
  pillInactive: 'px-4 py-2 text-sm font-medium rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--btn-secondary-bg)]/50 transition-colors',
  tabActive: 'px-4 py-1.5 text-xs font-medium rounded-md bg-[var(--btn-primary-bg)] text-[var(--text-on-dark)] transition-all',
  tabInactive: 'px-4 py-1.5 text-xs font-medium rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all',
} as const

// ═══════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════

export const table = {
  wrapper: 'w-full text-left border-collapse',
  headRow: 'bg-[var(--bg-surface-alt)] border-b border-[var(--border)]',
  headCell: 'py-4 px-4 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]',
  bodyRow: 'border-b border-[var(--bg-surface-hover)] hover:bg-[var(--bg-surface-alt)]/60 transition-colors',
  cell: 'p-4',
  badge: 'px-2 py-1 bg-[var(--bg-surface-alt)] border border-[var(--border)] rounded text-xs text-[var(--text-secondary)]',
  badgeGreen: 'px-2 py-1 rounded text-xs font-bold text-[var(--accent-green)] bg-[var(--accent-green)]/10',
  badgeRed: 'px-2 py-1 rounded text-xs font-bold text-[var(--accent-red)] bg-[var(--accent-red)]/10',
} as const

// ═══════════════════════════════════════════
// DONUT CHARTS
// ═══════════════════════════════════════════

export const donut = {
  emptyState: 'h-64 flex items-center justify-center text-[var(--text-muted)]',
  shell: 'flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12',
  chartColumn: 'w-full lg:w-[60%] relative flex justify-center',
  chartBox: 'w-64 h-64 lg:w-80 lg:h-80',
  centerOverlay: 'absolute inset-0 flex items-center justify-center pointer-events-none z-10',
  centerValue: 'text-2xl font-bold text-[var(--text-primary)]',
  centerLabel: 'text-sm text-[var(--text-muted)] mt-1',
  legendColumn: 'w-full lg:w-[40%]',
  legendStack: 'space-y-3 w-full',
  legendItem: 'group flex items-center justify-between p-4 rounded-lg bg-[var(--bg-surface-alt)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer',
  legendLeft: 'flex items-center gap-3 flex-1 min-w-0',
  legendDot: 'w-4 h-4 rounded-full flex-shrink-0',
  legendRight: 'flex items-center gap-4 flex-shrink-0 ml-4',
  legendValue: 'text-[var(--text-primary)] font-semibold text-sm whitespace-nowrap',
  legendPct: 'text-[var(--text-muted)] font-semibold text-sm whitespace-nowrap',
} as const

// ═══════════════════════════════════════════
// COLORS (Le Corbusier palette)
// ═══════════════════════════════════════════

export const colors = {
  chart: ['#4A6FA5', '#C25B3F', '#6B8F71', '#C4A35A', '#8B6F8B', '#5B8A8A'],
  positive: 'text-[var(--accent-green)]',
  negative: 'text-[var(--accent-red)]',
  muted: 'text-[var(--text-muted)]',
  white: 'text-[var(--text-primary)]',
} as const

// ═══════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════

export const app = {
  body: 'min-h-screen text-[var(--text-primary)] bg-[var(--bg-body)]',
  main: 'p-8 max-w-screen-2xl mx-auto',
  topBar: 'flex items-center justify-between px-8 py-5 bg-[var(--bg-surface)] border-b border-[var(--border)]',
} as const
