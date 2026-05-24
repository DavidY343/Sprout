import { button } from '../../styles/theme'

interface GroupBySelectorProps {
  value: 'type' | 'theme' | 'asset'
  onChange: (value: 'type' | 'theme' | 'asset') => void
}

export default function GroupBySelector({ value, onChange }: GroupBySelectorProps) {
  return (
    <div className="flex space-x-1 bg-[#FAF7F0] rounded-lg p-1 border border-[#E5DED3]">
      <button
        onClick={() => onChange('type')}
        className={value === 'type' ? button.pillActive : button.pillInactive}
      >
        Tipo
      </button>
      <button
        onClick={() => onChange('theme')}
        className={value === 'theme' ? button.pillActive : button.pillInactive}
      >
        Temática
      </button>
      <button
        onClick={() => onChange('asset')}
        className={value === 'asset' ? button.pillActive : button.pillInactive}
      >
        Activos
      </button>
    </div>
  )
}