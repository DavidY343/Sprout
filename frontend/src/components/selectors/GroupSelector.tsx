
interface GroupBySelectorProps {
  value: 'type' | 'theme' | 'asset'
  onChange: (value: 'type' | 'theme' | 'asset') => void
}

export default function GroupBySelector({ value, onChange }: GroupBySelectorProps) {
  return (
    <div className="flex space-x-1 bg-[#0f172a] rounded-lg p-1">
      <button
        onClick={() => onChange('type')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          value === 'type'
            ? 'bg-purple-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        Tipo
      </button>
      <button
        onClick={() => onChange('theme')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          value === 'theme'
            ? 'bg-purple-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        Temática
      </button>
      <button
        onClick={() => onChange('asset')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          value === 'asset'
            ? 'bg-purple-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        Activos
      </button>
    </div>
  )
}