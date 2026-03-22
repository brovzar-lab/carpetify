# CARPETIFY — Política de Idioma y Guardarraíles Lingüísticos

> Este documento es la fuente de verdad para todo lo relacionado con idioma en la aplicación.
> Claude Code DEBE leer este archivo antes de generar cualquier componente de UI, prompt de IA, o documento de salida.

---

## REGLA CARDINAL

**Todo lo que el usuario ve, toca, lee o produce a través de esta aplicación está en español mexicano.**

No español peninsular. No español neutro de doblaje. Español mexicano profesional — el registro de un productor de cine que trabaja con IMCINE, no el de un libro de texto.

---

## ARQUITECTURA DE TRES CAPAS

### CAPA 1 — Código infraestructura: INGLÉS
```
✅ En inglés:
- Nombres de componentes React (BudgetSummary, ScreenplayParser, ValidationEngine)
- Funciones de utilidad (calculatePercentage, validateDateRange)
- Firebase collections y subcollections (projects, team_members, generated_docs)
- Variables de control de flujo (isValid, hasError, isComplete)
- Comentarios técnicos sobre lógica de programación
- Git commits, PR descriptions, README técnico del repo
- Nombres de archivos de código (.tsx, .ts, .js)

❌ NUNCA en inglés:
- Texto visible en la interfaz de usuario
- Labels de formularios
- Mensajes de error que ve el usuario
- Tooltips, placeholders, botones
- Contenido de documentos generados
- Nombres de campos en formularios
- Opciones en dropdowns/selects
```

### CAPA 2 — Modelo de dominio (schemas, campos, etiquetas): ESPAÑOL
```
✅ Los schemas JSON ya usan nombres en español:
- titulo_proyecto (NO project_title)
- monto_solicitado_eficine_mxn (NO eficine_requested_amount)
- presupuesto_desglosado (NO detailed_budget)
- flujo_efectivo (NO cash_flow)
- esquema_financiero (NO financing_scheme)

✅ Las descripciones dentro de los schemas son bilingües:
- La descripción técnica para el desarrollador puede estar en inglés
- El "description" que se muestra al usuario DEBE estar en español

✅ Los enums usan los términos exactos de IMCINE:
- enum: ["Ficción", "Documental", "Animación"] (NO "Fiction", "Documentary")
- enum: ["Efectivo", "Especie"] (NO "Cash", "In-kind")
- enum: ["Preproducción", "Producción (Rodaje)", "Postproducción"]
```

### CAPA 3 — Prompts de generación IA: 100% ESPAÑOL
```
✅ Todo prompt de runtime que genera documentos para la carpeta:
- System prompt: en español
- User prompt con datos del proyecto: en español
- Instrucciones de formato: en español
- Criterios de evaluación citados: en español (copiados textualmente de los Lineamientos)
- Output esperado: en español

❌ NUNCA mezclar idiomas en un prompt de generación:
- NO: "Generate a propuesta de producción for the following project..."
- SÍ: "Genera una propuesta de producción para el siguiente proyecto..."
```

---

## TERMINOLOGÍA PROTEGIDA (NO TRADUCIR JAMÁS)

Estos términos son legales, fiscales, o institucionales. Si se traducen, pierden su significado normativo. La app debe usarlos exactamente como aparecen:

### Institucionales
| Término | Contexto | NUNCA decir |
|---------|----------|-------------|
| EFICINE | Nombre del programa | "Film Tax Incentive" |
| ERPI | Empresa Responsable del Proyecto de Inversión | "Responsible Company" |
| IMCINE | Instituto Mexicano de Cinematografía | "Mexican Film Institute" |
| INDAUTOR | Instituto Nacional del Derecho de Autor | "Copyright Office" |
| Comité Interinstitucional | Órgano que autoriza | "Committee" |
| Consejo de Evaluación (CE) | Órgano que califica | "Evaluation Council" |
| SAT | Servicio de Administración Tributaria | "Tax Authority" |
| SHCP | Secretaría de Hacienda | "Treasury Department" |
| DOF | Diario Oficial de la Federación | "Official Gazette" |

### Fiscales / Legales
| Término | NUNCA decir |
|---------|-------------|
| Estímulo fiscal | "Tax incentive" (en documentos de salida) |
| Contribuyente aportante | "Taxpayer donor" |
| Derechos patrimoniales | "Patrimonial rights" / "Property rights" |
| Derechos morales | "Moral rights" |
| Cesión de derechos | "Rights assignment" |
| Obra por encargo | "Work for hire" |
| Constancia de Situación Fiscal | "Tax Status Certificate" |
| e.firma | "Electronic signature" |
| CFDI | "Digital invoice" |
| Acta constitutiva | "Articles of incorporation" |
| Poder notarial | "Power of attorney" |
| Persona moral / física | "Legal entity / individual" |

### Cinematográficos
| Término | NUNCA decir |
|---------|-------------|
| Largometraje | "Feature film" (en docs) |
| Cortometraje | "Short film" (en docs) |
| Ópera prima | "First feature" / "Debut" |
| Plan de rodaje | "Shooting schedule" |
| Ruta crítica | "Critical path" |
| Presupuesto desglosado | "Detailed budget" |
| Flujo de efectivo | "Cash flow" |
| Esquema financiero | "Financing scheme" |
| Copia final | "Final print" / "Deliverable" |
| Jornada | "Shooting day" |
| Cuartilla | "Page" (una cuartilla ≈ 1,800 caracteres / ~250 palabras) |

### Formatos IMCINE
| Término | Descripción |
|---------|-------------|
| FORMATO 1 | Resumen Ejecutivo |
| FORMATO 2 | Solidez del Equipo Creativo |
| FORMATO 3 | Flujo de Efectivo |
| FORMATO 4 | Estatus Proyectos EFICINE Anteriores |
| FORMATO 5 | Cadena de Cesiones |
| FORMATO 6 | Carta Compromiso Buenas Prácticas |
| FORMATO 7 | Carta Compromiso PICS |
| FORMATO 8 | Ficha Técnica |
| FORMATO 9 | Esquema Financiero |
| FORMATO 10 | Carta de Aportación Exclusiva |
| FORMATO 11 | Relación de CFDIs |

---

## INTERFAZ DE USUARIO — REGLAS DE ESPAÑOL

### Formularios
```
✅ Labels: "Título del proyecto", "Monto solicitado (MXN)", "Género cinematográfico"
❌ Labels: "Project Title", "Requested Amount", "Film Genre"

✅ Placeholders: "Ej. El Godín de los Cielos", "Ingresa el monto en pesos mexicanos"
❌ Placeholders: "e.g. My Movie Title", "Enter amount in MXN"

✅ Botones: "Guardar", "Generar documento", "Exportar carpeta", "Validar"
❌ Botones: "Save", "Generate", "Export", "Validate"

✅ Errors: "El monto de EFICINE no puede exceder el 80% del costo total"
❌ Errors: "EFICINE amount cannot exceed 80% of total cost"
```

### Mensajes de validación
```
✅ "⚠️ Los honorarios del productor en el contrato ($500,000) no coinciden con el presupuesto ($450,000). Corrige antes de continuar."
❌ "Warning: Producer fee mismatch between contract and budget."

✅ "🔴 Falta el certificado de INDAUTOR. Sin este documento, el proyecto no será evaluado."
❌ "Missing INDAUTOR certificate."

✅ "🟢 El esquema financiero cumple con la regla del 80/20."
❌ "Financial scheme passes 80/20 rule."
```

### Tooltips y ayuda contextual
```
✅ "El EFICINE es un estímulo fiscal del Artículo 189 de la LISR. Los contribuyentes que aporten recursos reciben un crédito fiscal equivalente al monto de su aportación."
❌ Cualquier explicación en inglés
```

---

## DOCUMENTOS GENERADOS — REGLAS DE PROSA

### Registro lingüístico
- **Formal pero no burocrático.** El tono es de productor profesional que presenta un proyecto sólido, no de burócrata que llena un formulario.
- **Preciso y concreto.** Los evaluadores leen cientos de carpetas. Nada de relleno, nada de adjetivos vacíos.
- **Vocabulario cinematográfico mexicano.** "Rodaje" (no "filmación" a secas). "Jornada" (no "día de trabajo"). "Locación" (no "ubicación de filmación"). "Elenco" (no "actores"). "Postproducción" (no "post").

### Errores comunes que la IA debe evitar
```
❌ "La película será filmada en diversas locaciones" → vago, dice nada
✅ "El rodaje contempla 28 jornadas en 4 locaciones: el Centro Histórico de CDMX (INT/EXT), una casa particular en Coyoacán (INT), la carretera México-Puebla (EXT), y los Estudios Churubusco para interiores controlados."

❌ "El presupuesto es adecuado para este tipo de producción" → evaluador no aprende nada
✅ "El presupuesto de $18,500,000 MXN contempla 28 jornadas de rodaje con un equipo técnico de 45 personas, congruente con la complejidad del guion (72 escenas, 14 locaciones, 3 secuencias nocturnas)."

❌ "Se buscará exhibir la película en festivales importantes" → no dice cuáles ni por qué
✅ "Se contempla estreno en el Festival Internacional de Cine de Morelia (FICM) por su afinidad con el cine mexicano de autor, seguido de ventana comercial en circuito Cinépolis de 80-120 pantallas."
```

### Formato de montos
```
✅ $18,500,000 MXN (con comas como separador de miles, sin centavos, con "MXN")
❌ $18500000 / $18,500,000.00 / 18.5M / MX$18,500,000
```

### Formato de fechas
```
✅ "Agosto 2026", "15 de julio de 2026"
❌ "August 2026", "07/15/2026", "2026-07-15"
```

### Formato de porcentajes
```
✅ "El 20% del presupuesto total" / "equivalente al 3% del costo total (IVA incluido)"
❌ "20 percent" / "0.20 of total"
```

---

## REGLAS PARA LOS PROMPTS DE GENERACIÓN

Cada prompt en la carpeta `prompts/` debe seguir esta estructura:

```
1. ROL: Definir la persona en español (productor, abogado, line producer)
2. CONTEXTO EFICINE: Citar textualmente el requisito de los Lineamientos (en español)
3. CRITERIOS DE EVALUACIÓN: Lo que el CE busca (en español, del rubro de puntuación)
4. DATOS DEL PROYECTO: Inyectados en español
5. INSTRUCCIONES DE FORMATO: Extensión máxima, estructura, elementos obligatorios
6. GUARDARRAÍLES DE IDIOMA: Recordatorio explícito de hablar en español mexicano
7. EJEMPLO DE TONO: Fragmento modelo del registro lingüístico esperado
```

Cada prompt debe incluir al final:

```
INSTRUCCIÓN DE IDIOMA OBLIGATORIA:
- Escribe EXCLUSIVAMENTE en español mexicano profesional.
- Usa la terminología oficial de IMCINE y EFICINE sin traducir.
- Los montos van en pesos mexicanos con formato: $X,XXX,XXX MXN.
- Las fechas van en formato: "15 de julio de 2026" o "Agosto 2026".
- NO uses anglicismos innecesarios. Di "rodaje" (no "shooting"), "elenco" (no "cast"), "locación" (no "location" aunque esta última es aceptable en contexto técnico).
- El tono es profesional, directo y concreto — como un productor experimentado que sabe exactamente lo que está presentando.
```

---

## VALIDACIÓN DE IDIOMA EN EL PIPELINE

La app debe incluir un chequeo de idioma antes de exportar:

1. **Detección de anglicismos**: Escanear documentos generados por palabras en inglés que no deberían estar ahí (budget, schedule, cast, location, shooting, etc.)
2. **Verificación de formatos**: Montos en formato mexicano ($X,XXX,XXX MXN), fechas en español, porcentajes con "%"
3. **Consistencia de terminología**: Verificar que los términos protegidos (ERPI, EFICINE, etc.) aparezcan sin traducir
4. **Títulos idénticos**: El título del proyecto debe ser idéntico (carácter por carácter, incluyendo acentos y eñes) en todos los documentos generados
