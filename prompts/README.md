# Prompts de Generación — Carpetify

Cada archivo en esta carpeta es un system prompt en español que se envía a Claude en runtime cuando la app genera un documento específico de la carpeta EFICINE.

## Orden de ejecución

Los prompts se ejecutan en este orden porque cada documento posterior depende de datos generados por los anteriores:

```
PASADA 1 — ANÁLISIS DEL GUION (datos base para todo lo demás)
  └── analisis_guion.md → Extrae: escenas, locaciones, personajes, complejidad

PASADA 2 — LINE PRODUCER (producción y presupuesto)
  ├── a7_propuesta_produccion.md
  ├── a8_plan_rodaje_y_ruta_critica.md
  ├── a9_presupuesto.md
  └── a9d_flujo_efectivo.md

PASADA 3 — FINANZAS (esquema financiero)
  ├── e1_esquema_financiero.md
  └── e2_carta_aportacion.md

PASADA 4 — LEGAL (contratos y derechos)
  ├── b3_contratos_productor_director.md
  ├── c2b_cesion_derechos_guion.md
  ├── c3_cartas_compromiso.md
  └── validacion_legal.md

PASADA 5 — DOCUMENTOS COMBINADOS (dependen de todas las pasadas anteriores)
  ├── a1_resumen_ejecutivo.md
  ├── a2_sinopsis.md
  ├── a4_propuesta_direccion.md  (plantilla — el director debe completar)
  ├── a6_solidez_equipo.md
  ├── a10_propuesta_exhibicion.md
  ├── c4_ficha_tecnica.md
  └── pitch_contribuyentes.md

PASADA 6 — VALIDACIÓN CRUZADA
  └── validacion_cruzada.md
```

## Convención

Cada prompt incluye al final el bloque `INSTRUCCIÓN DE IDIOMA OBLIGATORIA` definido en `POLITICA_IDIOMA.md`. No se repite el bloque completo aquí — el código de la app lo inyecta automáticamente.

Cada prompt recibe datos del proyecto como variables `{{variable}}` que el código sustituye en runtime.
