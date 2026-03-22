import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { es } from '@/locales/es'
import type { ProyectoPrevio } from '@/schemas/erpi'

interface PriorProjectsListProps {
  projects: ProyectoPrevio[]
  onChange: (projects: ProyectoPrevio[]) => void
}

const EMPTY_PROJECT: ProyectoPrevio = {
  titulo: '',
  anio: new Date().getFullYear(),
  exhibido: false,
  estatus: 'en_produccion',
}

export function PriorProjectsList({ projects, onChange }: PriorProjectsListProps) {
  const handleAdd = () => {
    onChange([...projects, { ...EMPTY_PROJECT }])
  }

  const handleRemove = (index: number) => {
    onChange(projects.filter((_, i) => i !== index))
  }

  const handleUpdate = (index: number, field: keyof ProyectoPrevio, value: unknown) => {
    const updated = projects.map((p, i) =>
      i === index ? { ...p, [field]: value } : p,
    )
    onChange(updated)
  }

  return (
    <section className="space-y-4">
      <h2 className="text-[20px] font-semibold leading-[1.2]">
        {es.erpi.priorProjectsSection}
      </h2>

      <div className="space-y-4">
        {projects.map((project, index) => (
          <div
            key={index}
            className="relative rounded-lg border bg-card p-4 space-y-3"
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-7 w-7 p-0"
              onClick={() => handleRemove(index)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Eliminar</span>
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
              <div className="space-y-1.5">
                <Label className="text-[14px] font-semibold">Titulo</Label>
                <Input
                  value={project.titulo}
                  onChange={(e) => handleUpdate(index, 'titulo', e.target.value)}
                  placeholder="Nombre del proyecto"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[14px] font-semibold">Anio</Label>
                <Input
                  type="number"
                  value={project.anio}
                  onChange={(e) =>
                    handleUpdate(index, 'anio', parseInt(e.target.value, 10) || 0)
                  }
                  placeholder="2025"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[14px] font-semibold">Estatus</Label>
                <Select
                  value={project.estatus}
                  onValueChange={(v) =>
                    handleUpdate(index, 'estatus', v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exhibido">Exhibido</SelectItem>
                    <SelectItem value="en_produccion">En produccion</SelectItem>
                    <SelectItem value="no_exhibido">No exhibido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={project.exhibido}
                  onCheckedChange={(checked) =>
                    handleUpdate(index, 'exhibido', checked)
                  }
                />
                <Label className="text-[14px]">Exhibido</Label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="gap-1"
      >
        <Plus className="h-3.5 w-3.5" />
        {es.erpi.addPriorProject}
      </Button>
    </section>
  )
}
