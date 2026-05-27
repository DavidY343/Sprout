import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface HelpGuideProps {
  activeTab: string
}

const guides: Record<string, { title: string; items: string[] }> = {
  portfolio: {
    title: 'Portfolio',
    items: [
      'Aquí ves el resumen global de tus inversiones: valor total, cash disponible y rendimiento.',
      'Las tarjetas superiores (KPIs) muestran métricas clave como rentabilidad mensual, YTD y total.',
      'El gráfico muestra la evolución histórica de tu portfolio.',
      'Los donuts desglosan tu distribución por cuentas y por activos.',
      'La tabla inferior lista todos tus activos con cantidad, precio actual y ganancia/pérdida.',
    ],
  },
  trades: {
    title: 'Trades',
    items: [
      'Registra tus compras y ventas de activos pulsando el botón "+".',
      'Selecciona Comprar/Vender, la cantidad, el activo, la cuenta y la fecha.',
      'Puedes editar el precio de compra manualmente (no tiene por qué ser el precio actual).',
      'El total se calcula automáticamente: cantidad × precio.',
      'Cada trade genera automáticamente un movimiento de efectivo en la cuenta correspondiente.',
    ],
  },
  transactions: {
    title: 'Transacciones',
    items: [
      'Aquí gestionas los movimientos de efectivo: depósitos, retiradas y otros gastos.',
      'Pulsa "+" para añadir una nueva transacción.',
      'Los depósitos (income) aumentan tu cash disponible para invertir.',
      'Las retiradas (expense) reducen tu balance de efectivo.',
      'Las transacciones de trades se crean automáticamente al registrar un trade.',
    ],
  },
}

export default function HelpGuide({ activeTab }: HelpGuideProps) {
  const [open, setOpen] = useState(false)
  const guide = guides[activeTab] || guides.portfolio

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#4A6FA5] hover:bg-[#3D5F8F] text-white shadow-lg flex items-center justify-center transition cursor-pointer"
        aria-label="Ayuda"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl border border-[#E5DED3] shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#2C2C2C]">
                Guía — {guide.title}
              </h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[#F5F0E8] transition cursor-pointer">
                <X className="w-5 h-5 text-[#8B8578]" />
              </button>
            </div>

            <ul className="space-y-3">
              {guide.items.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#5A5549]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4A6FA5]/10 text-[#4A6FA5] text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="text-xs text-[#B0A99C] pt-2 border-t border-[#E5DED3]">
              Pulsa fuera o la X para cerrar.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
