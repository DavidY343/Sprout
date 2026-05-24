/**
 * Sprout Design System — Le Corbusier Edition
 * 
 * Paleta inspirada en la Polychromie Architecturale:
 * crema cáscara de huevo, terracota, azul arquitectónico,
 * verde salvia, ocre y carbón cálido.
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
  heroPanel: 'relative rounded-2xl p-8 bg-white border border-[#E5DED3] shadow-sm overflow-hidden',
  card: 'rounded-xl bg-white border border-[#E5DED3] p-6 shadow-sm',
  cardSm: 'rounded-xl bg-white border border-[#E5DED3] p-4 shadow-sm',
  tableContainer: 'rounded-xl bg-white border border-[#E5DED3] overflow-hidden shadow-sm',
  creatorPanel: 'bg-[#FAF7F0] border border-[#E5DED3] rounded-lg p-4 space-y-3',
  tooltip: 'bg-white border border-[#E5DED3] rounded-lg p-4 shadow-md min-w-[220px]',
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
  pageTitle: 'text-3xl font-bold mb-2 text-[#2C2C2C]',
  pageSubtitle: 'text-[#8B8578]',
  sectionTitle: 'text-xl font-semibold text-[#2C2C2C]',
  sectionDesc: 'text-sm text-[#8B8578]',
  fieldLabel: 'block text-sm font-medium text-[#5A5549] mb-2',
  kpiLabel: 'text-sm text-[#8B8578] mb-1',
  creatorTitle: 'text-lg font-medium text-[#2C2C2C]',
} as const

// ═══════════════════════════════════════════
// FORMS & INPUTS
// ═══════════════════════════════════════════

export const input = {
  base: 'w-full bg-[#FAF7F0] border border-[#D5CEC2] rounded-lg px-4 py-2 text-[#2C2C2C] placeholder-[#B0A99C] focus:outline-none focus:border-[#4A6FA5] transition',
  select: 'w-full bg-[#FAF7F0] border border-[#D5CEC2] rounded-lg px-4 py-2 text-[#2C2C2C]',
  glass: 'w-full px-4 py-3 rounded-lg bg-[#FAF7F0] border border-[#D5CEC2] text-[#2C2C2C] placeholder-[#B0A99C] focus:outline-none focus:border-[#4A6FA5] transition',
  number: 'w-full bg-[#FAF7F0] border border-[#D5CEC2] rounded-lg p-2 text-[#2C2C2C] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
  filter: 'bg-white text-[#2C2C2C] px-3 py-2 rounded-lg border border-[#D5CEC2]',
} as const

// ═══════════════════════════════════════════
// BUTTONS
// ═══════════════════════════════════════════

export const button = {
  primary: 'w-full py-3 px-4 rounded-lg bg-[#2C2C2C] text-[#FAF7F0] font-medium hover:bg-[#3D3D3D] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  secondary: 'px-4 py-2 bg-[#E5DED3] hover:bg-[#D5CEC2] rounded-lg text-[#2C2C2C] disabled:opacity-50 cursor-pointer',
  success: 'px-4 py-2 bg-[#6B8F71] hover:bg-[#5A7D60] rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  danger: 'flex items-center gap-2 px-4 py-2 rounded-lg border border-[#C25B3F]/30 text-[#C25B3F] hover:bg-[#C25B3F]/5 transition text-sm font-medium cursor-pointer',
  outline: 'flex items-center gap-2 px-4 py-2 bg-[#4A6FA5]/10 hover:bg-[#4A6FA5]/15 border border-[#4A6FA5]/30 rounded-lg transition-all hover:border-[#4A6FA5]/50 text-[#4A6FA5] cursor-pointer',
  pillActive: 'px-4 py-2 text-sm font-medium rounded-md bg-[#2C2C2C] text-[#FAF7F0]',
  pillInactive: 'px-4 py-2 text-sm font-medium rounded-md text-[#8B8578] hover:text-[#2C2C2C] hover:bg-[#E5DED3]/50 transition-colors',
  tabActive: 'px-4 py-1.5 text-xs font-medium rounded-md bg-[#2C2C2C] text-[#FAF7F0] transition-all',
  tabInactive: 'px-4 py-1.5 text-xs font-medium rounded-md text-[#8B8578] hover:text-[#2C2C2C] transition-all',
} as const

// ═══════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════

export const table = {
  wrapper: 'w-full text-left border-collapse',
  headRow: 'bg-[#FAF7F0] border-b border-[#E5DED3]',
  headCell: 'py-4 px-4 text-xs font-bold uppercase tracking-widest text-[#8B8578]',
  bodyRow: 'border-b border-[#F0EBE3] hover:bg-[#FAF7F0]/60 transition-colors',
  cell: 'p-4',
  badge: 'px-2 py-1 bg-[#FAF7F0] border border-[#E5DED3] rounded text-xs text-[#5A5549]',
  badgeGreen: 'px-2 py-1 rounded text-xs font-bold text-[#6B8F71] bg-[#6B8F71]/10',
  badgeRed: 'px-2 py-1 rounded text-xs font-bold text-[#C25B3F] bg-[#C25B3F]/10',
} as const

// ═══════════════════════════════════════════
// DONUT CHARTS
// ═══════════════════════════════════════════

export const donut = {
  emptyState: 'h-64 flex items-center justify-center text-[#8B8578]',
  shell: 'flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12',
  chartColumn: 'w-full lg:w-[60%] relative flex justify-center',
  chartBox: 'w-64 h-64 lg:w-80 lg:h-80',
  centerOverlay: 'absolute inset-0 flex items-center justify-center pointer-events-none z-10',
  centerValue: 'text-2xl font-bold text-[#2C2C2C]',
  centerLabel: 'text-sm text-[#8B8578] mt-1',
  legendColumn: 'w-full lg:w-[40%]',
  legendStack: 'space-y-3 w-full',
  legendItem: 'group flex items-center justify-between p-4 rounded-lg bg-[#FAF7F0] hover:bg-[#F0EBE3] transition-colors cursor-pointer',
  legendLeft: 'flex items-center gap-3 flex-1 min-w-0',
  legendDot: 'w-4 h-4 rounded-full flex-shrink-0',
  legendRight: 'flex items-center gap-4 flex-shrink-0 ml-4',
  legendValue: 'text-[#2C2C2C] font-semibold text-sm whitespace-nowrap',
  legendPct: 'text-[#8B8578] font-semibold text-sm whitespace-nowrap',
} as const

// ═══════════════════════════════════════════
// COLORS (Le Corbusier palette)
// ═══════════════════════════════════════════

export const colors = {
  chart: ['#4A6FA5', '#C25B3F', '#6B8F71', '#C4A35A', '#8B6F8B', '#5B8A8A'],
  positive: 'text-[#6B8F71]',
  negative: 'text-[#C25B3F]',
  muted: 'text-[#8B8578]',
  white: 'text-[#2C2C2C]',
} as const

// ═══════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════

export const app = {
  body: 'min-h-screen text-[#2C2C2C] bg-[#F5F0E8]',
  main: 'p-8 max-w-screen-2xl mx-auto',
  topBar: 'flex items-center justify-between px-8 py-5 bg-white border-b border-[#E5DED3]',
} as const
