import { useState } from 'react'
import { HelpCircle, X, ChevronRight, ChevronLeft } from 'lucide-react'

interface HelpGuideProps {
  activeTab: string
  portfolioView?: string
}

interface HelpSection {
  emoji: string
  title: string
  subtitle: string
  items: { icon: string; text: string }[]
  tips?: string[]
}

const guides: Record<string, HelpSection[]> = {
  'portfolio:resumen': [
    {
      emoji: '📊',
      title: 'Resumen general',
      subtitle: 'Tu cuadro de mandos principal',
      items: [
        { icon: '💰', text: 'Las 3 tarjetas superiores muestran el valor total de tu cartera, el capital invertido y el efectivo disponible.' },
        { icon: '📈', text: 'Las 4 tarjetas de rendimiento muestran la rentabilidad en distintos períodos: 1 mes, 3 meses, YTD (año en curso) y total desde el inicio.' },
        { icon: '🟢', text: 'El color verde/rojo indica si estás en ganancias o pérdidas en ese período.' },
      ],
      tips: ['El porcentaje se calcula comparando el valor actual con tu inversión neta.'],
    },
    {
      emoji: '📉',
      title: 'Gráfico histórico',
      subtitle: 'Evolución de tu patrimonio',
      items: [
        { icon: '🗓️', text: 'El gráfico de área muestra cómo ha variado el valor total de tu cartera a lo largo del tiempo.' },
        { icon: '🔀', text: 'Usa los botones superiores para filtrar por cuenta (General = todas las cuentas sumadas).' },
        { icon: '🖱️', text: 'Pasa el ratón sobre el gráfico para ver el valor exacto en cada fecha.' },
      ],
    },
    {
      emoji: '📋',
      title: 'Tabla de activos',
      subtitle: 'Detalle de cada posición',
      items: [
        { icon: '⚖️', text: 'Cada fila muestra: nombre del activo, cantidad, precio actual, valor total, peso en cartera (%) y beneficio/pérdida.' },
        { icon: '🏷️', text: 'El precio se actualiza automáticamente cada día por el worker de Sprout.' },
        { icon: '📊', text: 'Ordena por cualquier columna haciendo clic en la cabecera.' },
      ],
      tips: ['Si un activo no muestra precio, verifica que el ticker de Yahoo Finance sea correcto en Configuración → Activos.'],
    },
  ],
  'portfolio:distribucion': [
    {
      emoji: '🍩',
      title: 'Distribución por cuentas',
      subtitle: 'Donut izquierdo',
      items: [
        { icon: '🏦', text: 'Muestra cómo se reparte tu capital total entre tus diferentes cuentas de inversión.' },
        { icon: '🎯', text: 'Pasa el ratón sobre cada segmento para ver el valor exacto y porcentaje de esa cuenta.' },
        { icon: '🔍', text: 'Usa el selector de cuenta para aislar una cuenta concreta.' },
      ],
    },
    {
      emoji: '🧩',
      title: 'Distribución de activos',
      subtitle: 'Donut derecho',
      items: [
        { icon: '📂', text: 'Visualiza cómo se distribuyen tus activos según el criterio que elijas.' },
        { icon: '🏷️', text: 'Agrupar por Tipo: acciones, ETFs, fondos, crypto…' },
        { icon: '🎨', text: 'Agrupar por Temática: tecnología, energía, inmobiliario…' },
        { icon: '📌', text: 'Agrupar por Activo: un segmento por cada posición individual.' },
      ],
      tips: ['La temática se asigna al crear el activo en Configuración. Puedes cambiarla en cualquier momento.'],
    },
  ],
  'portfolio:mapa': [
    {
      emoji: '🗺️',
      title: 'Treemap de activos',
      subtitle: 'Vista panorámica de tu cartera',
      items: [
        { icon: '📐', text: 'El tamaño de cada bloque es proporcional al valor total de esa posición. Más grande = más peso en tu cartera.' },
        { icon: '🟢', text: 'El color indica rendimiento: verde intenso = alta ganancia, rojo intenso = alta pérdida, neutro = sin cambios.' },
        { icon: '🖱️', text: 'Pasa el ratón sobre un bloque para ver el ticker, valor actual, peso y rentabilidad exacta.' },
        { icon: '👁️', text: 'Ideal para detectar de un vistazo si tu cartera está demasiado concentrada en un solo activo.' },
      ],
      tips: ['Si todos los bloques son del mismo tamaño, tu cartera está bien diversificada por peso.'],
    },
  ],
  trades: [
    {
      emoji: '📈',
      title: 'Registrar operaciones',
      subtitle: 'Compras y ventas de activos',
      items: [
        { icon: '➕', text: 'Pulsa el botón "+" para abrir el formulario de nueva operación.' },
        { icon: '🔄', text: 'Selecciona "Comprar" o "Vender" según el tipo de operación.' },
        { icon: '📋', text: 'Rellena: activo, cuenta, cantidad, precio unitario y fecha de ejecución.' },
        { icon: '🧮', text: 'El total se calcula automáticamente: cantidad × precio.' },
        { icon: '💸', text: 'Al guardar, se genera un movimiento de efectivo automático en la cuenta (reduce cash al comprar, lo aumenta al vender).' },
      ],
      tips: [
        'El precio no tiene que ser el actual — pon el precio real al que ejecutaste la orden.',
        'Si te equivocas, puedes editar o eliminar la operación después.',
      ],
    },
    {
      emoji: '✏️',
      title: 'Editar operaciones',
      subtitle: 'Modificar registros existentes',
      items: [
        { icon: '🖱️', text: 'Haz clic en cualquier fila de la tabla para seleccionar la operación.' },
        { icon: '📝', text: 'Se abrirá el formulario con los datos actuales pre-rellenados.' },
        { icon: '💾', text: 'Modifica lo que necesites y guarda. El movimiento de efectivo se actualizará automáticamente.' },
        { icon: '🗑️', text: 'También puedes eliminar la operación, lo que revertirá el movimiento de efectivo asociado.' },
      ],
    },
    {
      emoji: '📊',
      title: 'Tabla de operaciones',
      subtitle: 'Historial completo',
      items: [
        { icon: '📅', text: 'Las operaciones se muestran ordenadas por fecha (más recientes arriba).' },
        { icon: '🔍', text: 'Puedes filtrar por cuenta o activo usando los selectores.' },
        { icon: '🏷️', text: 'Cada fila muestra: fecha, tipo (compra/venta), activo, cantidad, precio, total y cuenta.' },
      ],
    },
  ],
  transactions: [
    {
      emoji: '💰',
      title: 'Movimientos de efectivo',
      subtitle: 'Depósitos, retiradas y gastos',
      items: [
        { icon: '➕', text: 'Pulsa "+" para registrar un nuevo movimiento de dinero en tus cuentas.' },
        { icon: '📥', text: 'Ingreso (income): dinero que entra en tu cuenta (depósito, transferencia, dividendo cobrado).' },
        { icon: '📤', text: 'Gasto (expense): dinero que sale de tu cuenta (retirada, comisión, impuesto).' },
        { icon: '🤖', text: 'Los movimientos de compra/venta se crean automáticamente al registrar operaciones — no los dupliques.' },
      ],
      tips: [
        'Registra aquí los dividendos cobrados para que cuenten como ingreso en tu cuenta.',
        'Las comisiones del broker se registran como gasto para que se reflejen en tu rendimiento real.',
      ],
    },
    {
      emoji: '📋',
      title: 'Tabla de balances',
      subtitle: 'Historial de movimientos',
      items: [
        { icon: '📅', text: 'Los movimientos se muestran por fecha, más recientes arriba.' },
        { icon: '🔍', text: 'Filtra por cuenta para ver solo los movimientos de un broker concreto.' },
        { icon: '🏷️', text: 'Cada fila muestra: fecha, tipo (ingreso/gasto), concepto, importe y cuenta.' },
        { icon: '💡', text: 'El saldo de efectivo de cada cuenta se calcula sumando todos estos movimientos.' },
      ],
    },
  ],
  friends: [
    {
      emoji: '👥',
      title: 'Carteras de amigos',
      subtitle: 'Visualización en modo lectura',
      items: [
        { icon: '👤', text: 'Verás una tarjeta por cada amigo aceptado. Haz clic para ver su dashboard completo.' },
        { icon: '📊', text: 'El dashboard de un amigo muestra: KPIs, gráfico histórico y tabla de activos (como tu propio resumen).' },
        { icon: '🔒', text: 'Es solo lectura: puedes ver pero no modificar nada de su cartera.' },
        { icon: '🤝', text: 'Para añadir amigos, ve a Configuración → Amigos y envía una solicitud por email.' },
      ],
      tips: [
        'Tu amigo también podrá ver tu cartera en modo lectura.',
        'Puedes eliminar una amistad en cualquier momento desde Configuración → Amigos.',
      ],
    },
  ],
}

export default function HelpGuide({ activeTab, portfolioView }: HelpGuideProps) {
  const [open, setOpen] = useState(false)
  const [sectionIdx, setSectionIdx] = useState(0)

  const guideKey = activeTab === 'portfolio' ? `portfolio:${portfolioView || 'resumen'}` : activeTab
  const sections = guides[guideKey] || guides['portfolio:resumen']

  const handleOpen = () => { setSectionIdx(0); setOpen(true) }
  const current = sections[sectionIdx] || sections[0]
  const isFirst = sectionIdx === 0
  const isLast = sectionIdx === sections.length - 1

  return (
    <>
      {/* Botón flotante */}
      <button
        data-tour="help-button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--accent-blue)] hover:bg-[#3D5F8F] text-white shadow-lg flex items-center justify-center transition cursor-pointer"
        aria-label="Ayuda"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-[var(--bg-surface-alt)]">
              <div
                className="h-full bg-[var(--accent-blue)] transition-all duration-500 rounded-r"
                style={{ width: `${((sectionIdx + 1) / sections.length) * 100}%` }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{current.emoji}</span>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">{current.title}</h2>
                  <p className="text-xs text-[var(--accent-blue)] font-medium">{current.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[55vh] overflow-y-auto space-y-3">
              {current.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.text}</p>
                </div>
              ))}

              {current.tips && current.tips.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-[var(--accent-blue)]/5 border border-[var(--accent-blue)]/15">
                  <p className="text-xs font-semibold text-[var(--accent-blue)] mb-1.5">💡 Consejos</p>
                  {current.tips.map((tip, i) => (
                    <p key={i} className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">• {tip}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer nav */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
              <button
                onClick={() => setSectionIdx(s => s - 1)}
                disabled={isFirst}
                className="flex items-center gap-0.5 px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>

              {/* Dots */}
              <div className="flex gap-1.5">
                {sections.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSectionIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === sectionIdx ? 'w-5 bg-[var(--accent-blue)]'
                      : i < sectionIdx ? 'w-1.5 bg-[var(--accent-blue)]/40'
                      : 'w-1.5 bg-[var(--text-muted)]/20'
                    }`}
                  />
                ))}
              </div>

              {isLast ? (
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--accent-blue)] hover:opacity-90 transition cursor-pointer"
                >
                  Entendido
                </button>
              ) : (
                <button
                  onClick={() => setSectionIdx(s => s + 1)}
                  className="flex items-center gap-0.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--accent-blue)] hover:opacity-90 transition cursor-pointer"
                >
                  Siguiente <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
