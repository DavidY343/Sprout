import { AccountWithBalance } from '../../types/account'
import { input } from '../../styles/theme'

interface Props {
  accounts: AccountWithBalance[]
  selected: number | 'all'
  onChange: (value: number | 'all') => void
}

export default function AccountSelector({
  accounts,
  selected,
  onChange
}: Props) {
  return (
    <select
      value={selected}
      onChange={e =>
        onChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
      }
      className={input.filter}
    >
      <option value="all">Todas las cuentas</option>
      {accounts.map(acc => (
        <option key={acc.account_id} value={acc.account_id}>
          {acc.name}
        </option>
      ))}
    </select>
  )
}
