import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MXNInput } from '@/components/common/MXNInput'
import { X } from 'lucide-react'
import { TIPOS_APORTANTE } from '@/lib/constants'
import type { Tercero } from '@/schemas/financials'

interface ContributorRowProps {
  value: Tercero
  onChange: (updated: Tercero) => void
  onRemove: () => void
}

/**
 * Single row in the dynamic contributor list per D-15.
 * Fields: nombre, tipo (Donante/Coproductor/Distribuidor/Plataforma), monto, efectivo/especie.
 */
export function ContributorRow({
  value,
  onChange,
  onRemove,
}: ContributorRowProps) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <Input
          value={value.nombre}
          placeholder="Nombre del aportante"
          onChange={(e) => onChange({ ...value, nombre: e.target.value })}
        />
      </div>

      <div className="w-40">
        <Select
          value={value.tipo}
          onValueChange={(v) =>
            onChange({ ...value, tipo: v as (typeof TIPOS_APORTANTE)[number] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_APORTANTE.map((tipo) => (
              <SelectItem key={tipo} value={tipo}>
                {tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-48">
        <MXNInput
          value={value.monto_centavos}
          onChange={(centavos) =>
            onChange({ ...value, monto_centavos: centavos })
          }
          placeholder="Monto"
        />
      </div>

      <div className="w-32">
        <Select
          value={value.efectivo_o_especie}
          onValueChange={(v) =>
            onChange({
              ...value,
              efectivo_o_especie: v as 'efectivo' | 'especie',
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="especie">Especie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="ghost" size="icon" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
