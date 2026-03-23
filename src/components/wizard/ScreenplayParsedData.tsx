import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { es } from '@/locales/es'
import type { Screenplay, Escena } from '@/schemas/screenplay'

interface ScreenplayParsedDataProps {
  data: Screenplay
  onChange: (data: Screenplay) => void
}

/**
 * Parsed screenplay data editor -- right panel of Screen 2.
 * Shows summary cards at top, editable lists of locations, characters, and scenes.
 * Supports manual entry and add/remove operations per D-24, D-25, D-26.
 */
export function ScreenplayParsedData({
  data,
  onChange,
}: ScreenplayParsedDataProps) {
  const [scenesExpanded, setScenesExpanded] = useState(false)

  // Show manual entry warning only when extraction failed (uploaded/error/extraction_error)
  const showManualWarning =
    data.screenplay_status === 'uploaded' ||
    data.screenplay_status === 'error' ||
    data.screenplay_status === 'extraction_error'

  // Summary stats
  const sceneCount = data.escenas.length
  const locationCount = data.locaciones.length
  const characterCount = data.personajes.length
  const intCount = data.escenas.filter((s) => s.int_ext === 'INT').length
  const extCount = data.escenas.filter((s) => s.int_ext === 'EXT').length
  const dayCount = data.escenas.filter((s) => s.dia_noche === 'DIA').length
  const nightCount = data.escenas.filter((s) => s.dia_noche === 'NOCHE').length

  // -- Location handlers --
  const addLocation = useCallback(() => {
    onChange({
      ...data,
      locaciones: [
        ...data.locaciones,
        { nombre: '', tipo: 'INT', frecuencia: 1 },
      ],
    })
  }, [data, onChange])

  const removeLocation = useCallback(
    (index: number) => {
      onChange({
        ...data,
        locaciones: data.locaciones.filter((_, i) => i !== index),
      })
    },
    [data, onChange],
  )

  const updateLocation = useCallback(
    (index: number, field: string, value: string | number) => {
      const updated = [...data.locaciones]
      updated[index] = { ...updated[index], [field]: value }
      onChange({ ...data, locaciones: updated })
    },
    [data, onChange],
  )

  // -- Character handlers --
  const addCharacter = useCallback(() => {
    onChange({
      ...data,
      personajes: [
        ...data.personajes,
        { nombre: '', num_escenas: 0, es_protagonista: false },
      ],
    })
  }, [data, onChange])

  const removeCharacter = useCallback(
    (index: number) => {
      onChange({
        ...data,
        personajes: data.personajes.filter((_, i) => i !== index),
      })
    },
    [data, onChange],
  )

  const updateCharacter = useCallback(
    (index: number, field: string, value: string | number | boolean) => {
      const updated = [...data.personajes]
      updated[index] = { ...updated[index], [field]: value }
      onChange({ ...data, personajes: updated })
    },
    [data, onChange],
  )

  // -- Scene handlers --
  const updateScene = useCallback(
    (index: number, field: keyof Escena, value: unknown) => {
      const updated = [...data.escenas]
      updated[index] = { ...updated[index], [field]: value }
      onChange({ ...data, escenas: updated })
    },
    [data, onChange],
  )

  return (
    <div className="space-y-6 overflow-y-auto p-4">
      {/* Manual entry fallback warning */}
      {showManualWarning && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          {es.screen2.parserFailed}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-2">
        <SummaryCard label="Escenas" value={sceneCount} />
        <SummaryCard label="Locaciones" value={locationCount} />
        <SummaryCard label="Personajes" value={characterCount} />
        <SummaryCard
          label="INT-EXT"
          value={`${intCount}/${extCount}`}
        />
        <SummaryCard
          label="DIA-NOCHE"
          value={`${dayCount}/${nightCount}`}
        />
      </div>

      <Separator />

      {/* General info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Paginas</Label>
          <Input
            type="number"
            min={0}
            value={data.num_paginas ?? ''}
            onChange={(e) =>
              onChange({
                ...data,
                num_paginas: e.target.value
                  ? parseInt(e.target.value, 10)
                  : undefined,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Dias de rodaje estimados</Label>
          <Input
            type="number"
            min={0}
            value={data.dias_rodaje_estimados ?? ''}
            onChange={(e) =>
              onChange({
                ...data,
                dias_rodaje_estimados: e.target.value
                  ? parseInt(e.target.value, 10)
                  : undefined,
              })
            }
          />
        </div>
      </div>

      <Separator />

      {/* Locations */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Locaciones</h3>
          <Button variant="outline" size="sm" onClick={addLocation}>
            {es.screen2.addLocation}
          </Button>
        </div>
        {data.locaciones.map((loc, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={loc.nombre}
              placeholder="Nombre de la locacion"
              className="flex-1"
              onChange={(e) => updateLocation(i, 'nombre', e.target.value)}
            />
            <Badge variant="outline">{loc.tipo}</Badge>
            <Input
              type="number"
              min={0}
              value={loc.frecuencia}
              className="w-16"
              onChange={(e) =>
                updateLocation(i, 'frecuencia', parseInt(e.target.value, 10) || 0)
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeLocation(i)}
              title={es.screen2.removeItem}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </section>

      <Separator />

      {/* Characters */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Personajes</h3>
          <Button variant="outline" size="sm" onClick={addCharacter}>
            {es.screen2.addCharacter}
          </Button>
        </div>
        {data.personajes.map((char, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={char.nombre}
              placeholder="Nombre del personaje"
              className="flex-1"
              onChange={(e) => updateCharacter(i, 'nombre', e.target.value)}
            />
            <Input
              type="number"
              min={0}
              value={char.num_escenas}
              className="w-20"
              onChange={(e) =>
                updateCharacter(
                  i,
                  'num_escenas',
                  parseInt(e.target.value, 10) || 0,
                )
              }
            />
            <div className="flex items-center gap-1">
              <Label className="text-xs">Protagonista</Label>
              <Switch
                checked={char.es_protagonista}
                onCheckedChange={(v) => updateCharacter(i, 'es_protagonista', v)}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCharacter(i)}
              title={es.screen2.removeItem}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </section>

      <Separator />

      {/* Scenes (collapsed by default) */}
      <section className="space-y-3">
        <button
          className="flex w-full items-center gap-2 text-sm font-semibold"
          onClick={() => setScenesExpanded(!scenesExpanded)}
        >
          {scenesExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Escenas ({sceneCount})
        </button>

        {scenesExpanded &&
          data.escenas.map((scene, i) => (
            <div
              key={i}
              className="grid grid-cols-[50px_100px_100px_1fr_1fr] gap-2 items-center text-sm"
            >
              <span className="text-muted-foreground text-center">
                #{scene.numero}
              </span>
              <Select
                value={scene.int_ext}
                onValueChange={(v) => updateScene(i, 'int_ext', v)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INT">INT</SelectItem>
                  <SelectItem value="EXT">EXT</SelectItem>
                  <SelectItem value="INT-EXT">INT-EXT</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={scene.dia_noche}
                onValueChange={(v) => updateScene(i, 'dia_noche', v)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIA">DIA</SelectItem>
                  <SelectItem value="NOCHE">NOCHE</SelectItem>
                  <SelectItem value="AMANECER">AMANECER</SelectItem>
                  <SelectItem value="ATARDECER">ATARDECER</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={scene.locacion}
                className="h-8"
                onChange={(e) => updateScene(i, 'locacion', e.target.value)}
              />
              <Input
                value={scene.personajes.join(', ')}
                className="h-8"
                placeholder="Personajes (separados por coma)"
                onChange={(e) =>
                  updateScene(
                    i,
                    'personajes',
                    e.target.value.split(',').map((s) => s.trim()),
                  )
                }
              />
            </div>
          ))}
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-md border bg-muted/50 p-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}
