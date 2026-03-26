/**
 * All Spanish UI strings for Carpetify.
 * Source of truth: UI-SPEC.md Copywriting Contract.
 * Every user-visible string must come from this file.
 */
export const es = {
  // -- Dashboard --
  dashboard: {
    title: 'Mis Proyectos',
    newProject: '+ Nuevo Proyecto',
    emptyStateHeading: 'Sin proyectos',
    emptyStateBody:
      'Crea tu primer proyecto para comenzar a armar tu carpeta EFICINE.',
    emptyStateCTA: '+ Crear Proyecto',
    deleteConfirmTitle: 'Eliminar proyecto',
    deleteConfirmBody: (titulo: string) =>
      `Se eliminara permanentemente "${titulo}" y todos sus datos. Esta accion no se puede deshacer.`,
    deleteConfirmConfirm: 'Eliminar proyecto',
    deleteConfirmCancel: 'Conservar proyecto',
    cloneButton: 'Duplicar proyecto',
    cloneToast: 'Proyecto duplicado exitosamente',
    periodHeader: (periodo: number, anio: number) =>
      periodo === 1
        ? `Periodo 1 (Ene-Feb ${anio})`
        : `Periodo 2 (Jul ${anio})`,
    readyToSubmit: 'Listo para enviar',
    missingDocs: (n: number) => `Faltan ${n} documentos`,
    blockers: (n: number) => `${n} bloqueadores`,
    daysRemaining: (n: number) => `${n} dias restantes`,
  },

  // -- Wizard Sidebar --
  wizard: {
    screen1: 'Datos del Proyecto',
    screen2: 'Guion',
    screen3: 'Equipo Creativo',
    screen4: 'Estructura Financiera',
    screen5: 'Documentos',
    screen6: 'Generacion',
    screen7: 'Validacion',
    screen8: 'Exportar',
    backToDashboard: 'Mis Proyectos',
  },

  // -- Auto-Save Status --
  autoSave: {
    saving: 'Guardando...',
    saved: 'Guardado',
    error: 'Error al guardar. Reintentando...',
    offline: 'Sin conexion. Los cambios se guardaran al reconectar.',
  },

  // -- Screen 1: Datos del Proyecto --
  screen1: {
    title: 'Datos del Proyecto',
    emptyState:
      'Completa los datos basicos de tu proyecto cinematografico.',
    periodLabel: 'Periodo de registro EFICINE',
    coproductionToggle: 'Coproduccion internacional',
    coproductionHint:
      'Al activar, se habilitaran campos adicionales para tipo de cambio, desglose territorial y certificado IMCINE.',
    titleLabel: 'Titulo del proyecto',
    categoryLabel: 'Categoria cinematografica',
    directorCategoryLabel: 'Categoria del director',
    durationLabel: 'Duracion estimada (minutos)',
    formatLabel: 'Formato de filmacion',
    aspectRatioLabel: 'Relacion de aspecto',
    languagesLabel: 'Idiomas',
    totalBudgetLabel: 'Costo total del proyecto',
    eficineAmountLabel: 'Monto solicitado al estimulo EFICINE',
    // Submission tracking & regional bonus
    sectionRegionalBonus: 'Informacion regional y de solicitud',
    intentos_proyecto: 'Intentos de solicitud de este proyecto',
    director_origen_fuera_zmcm: 'Director originario fuera de la ZMCM',
    productor_origen_fuera_zmcm: 'Productor originario fuera de la ZMCM',
    porcentaje_rodaje_fuera_zmcm: 'Porcentaje de rodaje fuera de la ZMCM',
    porcentaje_personal_creativo_local: 'Porcentaje de personal creativo local',
    porcentaje_personal_tecnico_local: 'Porcentaje de personal tecnico local',
  },

  // -- Screen 2: Guion --
  screen2: {
    title: 'Guion',
    uploadCTA: 'Subir guion (PDF)',
    emptyStateHeading: 'Sin guion',
    emptyStateBody:
      'Sube el guion en formato PDF para generar el analisis automatico de escenas, locaciones y personajes.',
    parserFailed:
      'No se pudo extraer el texto correctamente. Puedes ingresar los datos manualmente.',
    reuploadConfirmBody:
      'Reemplazar guion borrara el analisis anterior. ¿Continuar?',
    reuploadConfirm: 'Reemplazar guion',
    reuploadCancel: 'Conservar guion actual',
    summaryLabels: 'Escenas / Locaciones / Personajes / INT-EXT / DIA-NOCHE',
    addLocation: '+ Agregar locacion',
    addCharacter: '+ Agregar personaje',
    removeItem: 'Eliminar',

    // Extraction states
    extracting: 'Extrayendo texto del guion...',
    extractionSuccess: 'Texto extraido exitosamente',
    extractionFailedLarge:
      'El guion excede el limite de 200 paginas o 15 MB. Sube un archivo mas pequeno.',
    extractionFailedInvalidPdf:
      'No se pudo leer el PDF. Verifica que sea un PDF digital (no escaneado) generado desde Final Draft, WriterSolo u otro software de guion.',
    extractionFailedScanned:
      'Este PDF parece ser una imagen escaneada. Solo se admiten PDFs digitales. Puedes ingresar los datos manualmente.',
    extractionTimeout:
      'La extraccion tardo demasiado. Intenta con un archivo mas pequeno.',

    // Analysis states
    analyzeCTA: 'Analizar guion',
    analyzeCTADisabledTooltip:
      'Primero sube un guion o ingresa los datos manualmente',
    analyzing:
      'Analizando guion... esto puede tomar hasta 30 segundos.',
    analysisSuccess: 'Analisis completado',
    analysisBadge: 'Analisis completo',
    analysisFailed:
      'No se pudo completar el analisis. Verifica tu conexion e intenta de nuevo.',
    analysisRetryCTA: 'Reintentar analisis',
    analysisStale:
      'El guion fue modificado despues del ultimo analisis. Los resultados pueden estar desactualizados.',
    reanalyzeCTA: 'Reanalizar guion',
    analysisTimeout:
      'El analisis tardo demasiado. Esto puede ocurrir con guiones muy largos. Intenta de nuevo.',
    analysisNetworkError:
      'Error de conexion durante el analisis. Verifica tu internet e intenta de nuevo.',
    analysisParseError:
      'No se pudo procesar la respuesta del analisis. Intenta de nuevo.',
    networkError:
      'Error de conexion. Verifica tu internet e intenta de nuevo.',
    genericError:
      'Ocurrio un error inesperado. Intenta de nuevo o recarga la pagina.',

    // Analysis results labels
    analysisResultsHeading: 'Resultados del Analisis',
    shootingDaysLabel: 'Dias de rodaje estimados',
    complexityLabel: 'Analisis de complejidad',
    complexityStunts: 'Escenas de riesgo / stunts',
    complexityVFX: 'Efectos visuales (VFX)',
    complexityWater: 'Escenas con agua',
    complexityAnimals: 'Escenas con animales',
    complexityChildren: 'Escenas con menores',
    nightPercentage: 'Porcentaje nocturno',
    lastAnalyzedLabel: 'Ultimo analisis',

    // Shooting day estimates
    estimateLow: 'Conservadora',
    estimateMid: 'Estandar',
    estimateHigh: 'Agresiva',
  },

  // -- Screen 3: Equipo Creativo --
  screen3: {
    title: 'Equipo Creativo',
    emptyStateBody:
      'Agrega los miembros del equipo creativo principal: productor, director, guionista, director de fotografia, director de arte y editor.',
    addMember: '+ Agregar miembro',
    inkindLabel: 'Aportacion en especie',
    inkindHint:
      'El monto en especie se descuenta automaticamente del honorario total.',
    feeLabel: 'Honorarios',
    filmographySection: 'Filmografia',
    addFilmographyEntry: '+ Agregar obra',
  },

  // -- Screen 4: Estructura Financiera --
  screen4: {
    title: 'Estructura Financiera',
    erpiSection: 'Aportacion ERPI',
    cashLabel: 'Efectivo',
    inkindLabel: 'Especie',
    thirdPartySection: 'Aportantes Terceros',
    addContributor: '+ Agregar aportante',
    contributorTypes: 'Donante / Coproductor / Distribuidor / Plataforma',
    gestorToggle: '¿Tiene gestor de recursos?',
    gestorHintFiction: 'Maximo 5% del monto EFICINE',
    gestorHintDocAnim: 'Maximo 4% del monto EFICINE',
    complianceTitle: 'Cumplimiento EFICINE',
    complianceERPI: (pct: string) =>
      `Aportacion ERPI: ${pct}% (minimo 20%)`,
    complianceEFICINE: (pct: string) =>
      `Estimulo EFICINE: ${pct}% (maximo 80%)`,
    complianceFederal: (pct: string) =>
      `Recursos federales: ${pct}% (maximo 80%)`,
    complianceScreenwriter: (pct: string) =>
      `Guionista: ${pct}% (minimo 3%)`,
    complianceInkind: (pct: string) =>
      `Especie total: ${pct}% (maximo 10%)`,
    complianceEFICINECap: (amount: string) =>
      `Monto EFICINE: ${amount} (maximo $25,000,000 MXN)`,
  },

  // -- Screen 5: Documentos --
  screen5: {
    title: 'Documentos',
    emptyStateBody:
      'Sube los documentos que la aplicacion no genera automaticamente: acta constitutiva, poderes, identificaciones, constancias, contratos firmados, etc.',
    uploadButton: 'Subir documento',
    statusUploaded: 'Subido',
    statusMissing: 'Faltante',
    statusExpired: 'Vencido',
    expirationWarning: (n: number) => `Vence en ${n} dias`,
  },

  // -- ERPI Settings --
  erpi: {
    title: 'Datos ERPI',
    description:
      'Informacion de la empresa solicitante. Se comparte entre todos los proyectos.',
    companySection: 'Datos de la Empresa',
    priorProjectsSection: 'Proyectos Previos EFICINE',
    addPriorProject: '+ Agregar proyecto previo',
    solicitudes_periodo_actual: 'Solicitudes en el periodo actual',
    domicilio_fuera_zmcm: 'Domicilio fiscal fuera de la ZMCM',
  },

  // -- Generation Screen --
  generation: {
    // Screen label
    screenLabel: 'Generacion',

    // Pipeline control
    generateCTA: 'Generar carpeta',
    generateCTATooltip: 'Primero completa el analisis del guion en la pantalla "Guion"',
    pipelineRunning: 'Generando documentos...',
    passLabels: {
      lineProducer: 'Paso 2: Line Producer',
      financeAdvisor: 'Paso 3: Finanzas',
      legal: 'Paso 4: Legal',
      combined: 'Paso 5: Documentos Combinados',
    },
    docGenerating: (name: string) => `Generando ${name}...`,
    docComplete: 'Listo',
    passComplete: (n: number, count: number) =>
      `Paso ${n} completado (${count} documentos)`,
    pipelineComplete: (count: number) =>
      `Carpeta generada exitosamente. ${count} documentos listos.`,
    pipelineIncomplete: 'Generacion incompleta',
    pipelineIncompleteBody: (n: number, total: number) =>
      `Se completaron ${n} de ${total} documentos. Los documentos generados se conservaron.`,
    resumeCTA: (n: number) => `Continuar desde Paso ${n}`,
    pipelineError:
      'Error al generar documentos. Los documentos anteriores se conservaron.',

    // Document list
    pageTitle: 'Documentos Generados',
    sectionHeaders: {
      A: 'Seccion A \u2014 Propuesta Artistica',
      B: 'Seccion B \u2014 Equipo de Trabajo',
      C: 'Seccion C \u2014 Aspectos Legales',
      D: 'Seccion D \u2014 Cotizaciones',
      E: 'Seccion E \u2014 Esquema Financiero',
      EXTRA: 'Documentos Adicionales',
    },
    statusPending: 'Pendiente',
    statusGenerating: 'Generando...',
    statusComplete: 'Listo',
    statusStale: 'Desactualizado',
    statusError: 'Error',
    statusEdited: 'Editado manualmente',
    emptyHeading: 'Sin documentos generados',
    emptyBody:
      'Completa los datos del proyecto y el analisis del guion, luego presiona "Generar carpeta" para producir todos los documentos.',

    // Document names (mapped to EFICINE IDs)
    docNames: {
      A1: 'Resumen Ejecutivo (FORMATO 1)',
      A2: 'Sinopsis',
      A4: 'Propuesta de Direccion',
      A6: 'Solidez del Equipo Creativo (FORMATO 2)',
      A7: 'Propuesta de Produccion',
      A8a: 'Plan de Rodaje',
      A8b: 'Ruta Critica',
      A9a: 'Presupuesto Resumen',
      A9b: 'Presupuesto Desglose',
      A9d: 'Flujo de Efectivo (FORMATO 3)',
      A10: 'Propuesta de Exhibicion',
      A11: 'Evaluacion Puntos Bonus',
      'B3-prod': 'Contrato Productor',
      'B3-dir': 'Contrato Director',
      C2b: 'Cesion de Derechos de Guion',
      C3a: 'Carta Buenas Practicas (FORMATO 6)',
      C3b: 'Carta PICS (FORMATO 7)',
      C4: 'Ficha Tecnica (FORMATO 8)',
      E1: 'Esquema Financiero (FORMATO 9)',
      E2: 'Carta Aportacion Exclusiva (FORMATO 10)',
      PITCH: 'Pitch para Contribuyentes',
    },

    // Viewer
    viewerEmptyHeading: 'Selecciona un documento',
    viewerEmptyBody:
      'Elige un documento de la lista para ver su contenido.',
    editButton: 'Editar documento',
    saveEdits: 'Guardar cambios',
    cancelEdits: 'Descartar cambios',
    editWarning:
      'Las ediciones manuales se perderan si regeneras este documento.',
    editSaved: 'Cambios guardados',
    editedBadge: 'Editado',
    wordExportButton: 'Exportar plantilla Word',
    wordExportTooltip:
      'Esta plantilla la completara el director externamente.',

    // Staleness & regeneration
    stalePassTitle: (n: number) => `Paso ${n} desactualizado`,
    staleReasonDataChanged:
      'Los datos de entrada fueron modificados. Regenera este paso para actualizar los documentos.',
    staleReasonUpstreamRegenerated: (n: number) =>
      `El Paso ${n} fue regenerado. Los documentos de este paso usan datos anteriores.`,
    regeneratePassCTA: (n: number) => `Regenerar Paso ${n}`,
    regenerateAllStaleCTA: 'Regenerar documentos desactualizados',
    regenerateConfirmTitle: (n: number) => `Regenerar Paso ${n}`,
    regenerateConfirmBody: (docList: string) =>
      `Este paso contiene documentos con ediciones manuales que se perderan: ${docList}. ¿Continuar?`,
    regenerateConfirm: 'Regenerar de todos modos',
    regenerateCancel: 'Conservar ediciones',
    cascadeTooltip: (deps: string) =>
      `Este paso depende de: ${deps}.`,

    // Budget editor (Plan 06 strings referenced by parallel agent)
    budgetSaved: 'Presupuesto actualizado',
    budgetHeading: 'Presupuesto Desglose',
    budgetBackLink: 'Volver a documentos',
    budgetColAccount: 'Cuenta',
    budgetColConcept: 'Concepto',
    budgetColUnit: 'Unidad',
    budgetColQty: 'Cantidad',
    budgetColUnitCost: 'Costo Unitario',
    budgetColSubtotal: 'Subtotal',
    budgetGrandTotal: 'Total General',
    budgetMismatch: (budgetTotal: string, projectTotal: string) =>
      `El total del presupuesto (${budgetTotal}) no coincide con el costo total del proyecto (${projectTotal}). Ajusta las partidas o actualiza el costo total en Datos del Proyecto.`,
    downstreamWarning: (field: string, docList: string) =>
      `${field} actualizado. Los siguientes documentos ahora son inconsistentes: ${docList}.`,

    // Error states
    timeoutError: (n: number) =>
      `La generacion del Paso ${n} tardo demasiado. Los documentos anteriores se conservaron. Intenta de nuevo.`,
    rateLimitError:
      'Limite de solicitudes alcanzado. Espera unos minutos e intenta de nuevo.',
    networkError:
      'Error de conexion durante la generacion. Verifica tu internet e intenta de nuevo.',
    firestoreError:
      'Error al guardar el documento generado. Intenta de nuevo.',
    templateVarError: (name: string) =>
      `Error en la plantilla del documento ${name}. Verifica que todos los campos del proyecto esten completos.`,
  },

  // -- Validation Dashboard --
  validation: {
    // Page & navigation
    pageTitle: 'Validacion',
    sidebarLabel: 'Validacion',

    // Summary
    summaryCanExport: 'Listo para exportar. Sin bloqueadores.',
    summaryCannotExport: (n: number) =>
      `${n} bloqueador(es) impiden la exportacion.`,
    summaryWarnings: (n: number) =>
      `${n} advertencia(s) detectada(s).`,
    summaryAllPass: 'Todas las reglas de cumplimiento se cumplen.',

    // Section headers
    sectionBlockers: 'Bloqueadores',
    sectionWarnings: 'Advertencias',
    sectionPassed: 'Cumplidas',
    sectionSkipped: 'Sin evaluar',

    // Rule status labels
    statusPass: 'Pasa',
    statusFail: 'Falla',
    statusWarning: 'Advertencia',
    statusSkip: 'Sin datos',

    // Stale validation
    staleBadge: 'Pendiente de re-validacion',

    // Navigation links
    goToField: 'Ir al campo',
    goToDocument: 'Ver documento',
    expandDetail: 'Ver detalles',
    collapseDetail: 'Ocultar detalles',

    // Rule names (14 rules)
    ruleNames: {
      'VALD-01': 'Conciliacion financiera',
      'VALD-02': 'Consistencia del titulo',
      'VALD-03': 'Honorarios cruzados',
      'VALD-04': 'Vigencia de documentos',
      'VALD-05': 'Cumplimiento EFICINE',
      'VALD-06': 'Completitud de documentos',
      'VALD-07': 'Experiencia minima',
      'VALD-08': 'Elegibilidad ERPI',
      'VALD-09': 'Formato de archivos',
      'VALD-10': 'Gastos prohibidos',
      'VALD-11': 'Ruta critica vs flujo',
      'VALD-12': 'Accesibilidad de enlaces',
      'VALD-13': 'Puntos bonus',
      'VALD-17': 'Vigencia de documentos cargados',
    } as Record<string, string>,

    // Pass messages
    passMessages: {
      'VALD-01': 'Presupuesto = Flujo de efectivo = Esquema financiero.',
      'VALD-02': 'El titulo es identico en todos los documentos.',
      'VALD-03': 'Honorarios de productor, director y guionista coinciden en contratos, presupuesto y flujo.',
      'VALD-04': 'Todos los documentos estan vigentes (dentro de los 3 meses).',
      'VALD-05': 'Todos los porcentajes EFICINE cumplen los limites.',
      'VALD-06': 'Todos los documentos requeridos estan presentes.',
      'VALD-07': 'Productor y director cumplen los requisitos de experiencia.',
      'VALD-08': 'La ERPI cumple los requisitos de elegibilidad.',
      'VALD-09': 'Todos los archivos cumplen formato, tamano y nombre.',
      'VALD-10': 'No se detectaron gastos prohibidos con fondos EFICINE.',
      'VALD-11': 'La ruta critica y el flujo de efectivo estan alineados.',
      'VALD-12': 'Todos los enlaces son accesibles publicamente.',
      'VALD-13': (categoria: string) =>
        `Categoria de puntos bonus detectada: ${categoria}.`,
      'VALD-17': 'Todos los documentos cargados estan vigentes.',
    } as Record<string, string | ((arg: string) => string)>,

    // Fail messages
    failMessages: {
      'VALD-01': (diff: string) =>
        `Los totales no coinciden: ${diff}.`,
      'VALD-02': (list: string) =>
        `El titulo no coincide en: ${list}.`,
      'VALD-03': (list: string) =>
        `Honorarios no coinciden: ${list}.`,
      'VALD-04': (list: string) =>
        `${list} documento(s) vencido(s) o proximo(s) a vencer.`,
      'VALD-05': (list: string) =>
        `Reglas EFICINE no cumplidas: ${list}.`,
      'VALD-06': (list: string) =>
        `Documentos faltantes: ${list}.`,
      'VALD-07': (list: string) =>
        `No se cumplen requisitos de experiencia: ${list}.`,
      'VALD-08': (reason: string) =>
        `No se cumple elegibilidad ERPI: ${reason}.`,
      'VALD-09': (list: string) =>
        `Archivos con problemas: ${list}.`,
      'VALD-10': (list: string) =>
        `Se detectaron gastos prohibidos con fondos EFICINE: ${list}.`,
      'VALD-11': (n: number, list: string) =>
        `${n} etapa(s) no coinciden entre ruta critica y flujo: ${list}.`,
      'VALD-12': (n: number, list: string) =>
        `${n} enlace(s) no son accesibles: ${list}.`,
      'VALD-13': 'No se detecta categoria de puntos bonus elegible. Revisa los requisitos.',
      'VALD-17': (n: number, list: string) =>
        `${n} documento(s) vencido(s) o proximo(s) a vencer: ${list}.`,
    } as Record<string, string | ((...args: never[]) => string)>,

    // Skip messages
    skipMessages: {
      'VALD-01': 'Genera el presupuesto, flujo de efectivo y esquema financiero para evaluar.',
      'VALD-02': 'No se ha definido el titulo del proyecto.',
      'VALD-03': 'Genera los contratos y el presupuesto para evaluar los honorarios.',
      'VALD-04': 'No hay documentos cargados con fecha de emision.',
      'VALD-05': 'Completa la estructura financiera para evaluar.',
      'VALD-06': 'No hay documentos generados ni cargados.',
      'VALD-07': 'Agrega la filmografia del productor y director para evaluar.',
      'VALD-08': 'Completa los datos ERPI para evaluar la elegibilidad.',
      'VALD-09': 'No hay archivos de salida para validar. Se evaluara al exportar.',
      'VALD-10': 'Genera el flujo de efectivo para evaluar gastos prohibidos.',
      'VALD-11': 'Genera la ruta critica y el flujo de efectivo para evaluar.',
      'VALD-12': 'No hay enlaces registrados para verificar.',
      'VALD-13': 'Completa los datos del equipo creativo para evaluar puntos bonus.',
      'VALD-17': 'No hay documentos con fecha de emision para evaluar vigencia.',
    } as Record<string, string>,

    // Document expiration
    expirationHeading: 'Vigencia de Documentos',
    expirationValid: (n: number) => `Vigente \u2014 ${n} dias restantes`,
    expirationApproaching: (n: number) =>
      `Proximo a vencer \u2014 ${n} dias restantes`,
    expirationCritical: (n: number) =>
      `Vence pronto \u2014 ${n} dias restantes`,
    expirationExpired: 'Vencido \u2014 requiere reemplazo',
    expirationCardBanner: (n: number) =>
      `${n} documento(s) vence(n) pronto`,
    expirationUploadAlert: (n: number) =>
      `Este documento vence en ${n} dias. Sube una version actualizada antes del cierre de registro.`,
    expirationUploadExpired:
      'Este documento esta vencido. Sube una version actualizada para continuar.',
    expirationRecalculated: (period: string) =>
      `Vigencias recalculadas para ${period}.`,

    // Hyperlink verification
    hyperlinkVerify: 'Verificar enlace',
    hyperlinkReverify: 'Verificar de nuevo',
    hyperlinkAccessible: 'Enlace accesible',
    hyperlinkNotAccessible:
      'Enlace no accesible. Verifica que sea publico y no requiera contrasena.',
    hyperlinkChecking: 'Verificando...',
    hyperlinkCorsError:
      'No se pudo verificar automaticamente',

    // Project card validation
    projectCardNoBlockers: 'Sin bloqueadores',
    projectCardWarnings: (n: number) => `${n} advertencia(s)`,

    // Error states
    dataLoadFailure:
      'No se pudieron cargar los datos del proyecto para validar. Recarga la pagina.',
  },

  // -- Score Estimation --
  scoring: {
    panelHeading: 'Estimacion de Puntaje',
    ctaButton: 'Evaluar puntaje',
    ctaButtonReevaluate: 'Re-evaluar puntaje',
    evaluatingState: 'Evaluando proyecto...',
    disclaimer:
      'Estimado basado en completitud y senales medibles. No es una prediccion del resultado del comite evaluador.',
    viabilitySection: (n: number) => `Viabilidad (${n}/38 pts)`,
    artisticSection: (n: number) =>
      `Merito Artistico (${n}/62 pts) \u2014 estimado`,
    bonusSection: (n: number) => `Puntos Bonus (${n}/5 pts)`,
    totalEstimated: (n: number, bonus: number) =>
      `Puntaje estimado: ${n}/100 (+${bonus} bonus)`,
    thresholdPass: 'El proyecto supera el minimo de 90 puntos.',
    thresholdFail: 'El proyecto no alcanza el minimo de 90 puntos.',
    thresholdClose: 'El proyecto esta cerca del minimo de 90 puntos.',
    improvementHeading: 'Mejoras sugeridas',
    improvementFormat: (pts: number, text: string) =>
      `+${pts} pts: ${text}`,
    averageWinner: 'Promedio ganador 2025: 94.63/100',
    personaLabel: (name: string) => `Evaluador: ${name}`,

    // Score categories (Spanish rubric labels)
    categories: {
      guion: 'Guion (40 pts)',
      direccion: 'Direccion (12 pts)',
      material_visual: 'Material Visual (10 pts)',
      equipo: 'Equipo Creativo (2 pts)',
      produccion: 'Produccion (12 pts)',
      plan_rodaje: 'Plan de Rodaje (10 pts)',
      presupuesto: 'Presupuesto (10 pts)',
      exhibicion: 'Exhibicion (4 pts)',
    },

    // Improvement suggestions (exact Spanish copy from UI-SPEC)
    improvements: {
      directorLinks:
        'Agrega enlaces a la filmografia del director para mejorar el puntaje de direccion.',
      pagesPerDay:
        'Reduce las paginas por dia de rodaje a un maximo de 5 para mayor viabilidad.',
      contingency:
        'Agrega una partida de imprevistos al presupuesto (minimo 10% del BTL).',
      spectatorEstimate:
        'Incluye estimacion de espectadores y recaudacion en la propuesta de exhibicion.',
      safeWorkplace:
        'Menciona el compromiso con un entorno laboral respetuoso en la propuesta de produccion.',
      festivalStrategy:
        'Incluye una estrategia de festivales en la propuesta de exhibicion.',
      monthlyDetail:
        'Detalla la ruta critica mes a mes para mejorar el puntaje de planeacion.',
      materialVisual:
        'Amplia el material visual a minimo 10 paginas para mayor solidez.',
    },

    // Bonus points
    bonusHeading: 'Puntos Bonus (+5)',
    bonusExplanation:
      'Solo se aplica UNA categoria. Se recomienda la mas fuerte.',
    bonusCategoryA: 'Directora mujer',
    bonusCategoryB: 'Director/a indigena o afromexicano/a',
    bonusCategoryC: 'Descentralizacion regional',
    bonusCategoryD: 'Equipo creativo 100% calificado',
    bonusMet: 'Cumplido',
    bonusNotMet: 'No cumplido',
    bonusRecommended: 'Categoria recomendada',
    bonusNoneEligible:
      'No se detecta categoria elegible. Revisa los requisitos de cada una.',

    // Persona names and descriptions
    personas: {
      reygadas: {
        name: 'Reygadas',
        label: 'Reygadas \u2014 Cine de arte',
        description: 'Perspectiva autoral y artistica',
      },
      marcopolo: {
        name: 'Marcopolo',
        label: 'Marcopolo \u2014 Cine comercial',
        description: 'Viabilidad comercial mexicana',
      },
      pato: {
        name: 'Pato',
        label: 'Pato \u2014 Escritura',
        description: 'Calidad narrativa y guion',
      },
      leo: {
        name: 'Leo',
        label: 'Leo \u2014 Produccion',
        description: 'Solidez de produccion',
      },
      alejandro: {
        name: 'Alejandro',
        label: 'Alejandro \u2014 Direccion comercial',
        description: 'Craft de direccion mainstream',
      },
    },

    // Error states for score estimation
    timeoutError:
      'La evaluacion de puntaje tardo demasiado. Intenta de nuevo.',
    rateLimitError:
      'Limite de solicitudes alcanzado. Espera unos minutos e intenta de nuevo.',
    retryEvaluation: 'Reintentar evaluacion',
  },

  // -- Export Screen --
  export: {
    // Page
    pageTitle: 'Exportar',

    // CTA states
    ctaLabel: 'Exportar carpeta',
    ctaSubtextBlockers: (n: number) => `${n} bloqueador(es) impiden la exportacion`,
    ctaSubtextWarnings: (n: number) => `${n} advertencia(s) — exportar de todos modos`,

    // Readiness messages
    readinessClean: 'Carpeta lista para exportar. Todos los documentos generados y validaciones cumplidas.',
    readinessWarnings: (n: number) => `${n} advertencia(s) detectada(s). Puedes exportar, pero revisa los avisos.`,
    readinessBlockers: (n: number) => `${n} bloqueador(es) impiden la exportacion. Resuelve los problemas antes de exportar.`,

    // Empty state
    emptyStateHeading: 'Genera los documentos primero',
    emptyStateBody: 'Completa los datos del proyecto y genera la carpeta desde la pantalla "Generacion" antes de exportar.',

    // Language check
    langCheckHeading: 'Verificacion de idioma',
    langCheckRunning: 'Verificando idioma y formatos...',
    langCheckPassed: 'Sin problemas detectados',
    langCheckAnglicisms: 'Anglicismos',
    langCheckFormats: 'Formatos de montos y fechas',
    langCheckTitles: 'Consistencia del titulo',
    langCheckAnglicismFlagged: (word: string, docName: string, replacement: string) =>
      `Anglicismo detectado: "${word}" en ${docName}. Sugerencia: usar "${replacement}".`,
    langCheckAnglicismNoted: (word: string) => `Termino tecnico aceptado: "${word}".`,
    langCheckFormatCurrency: (docName: string, found: string) =>
      `Formato de monto inconsistente en ${docName}: "${found}". Usar "$X,XXX,XXX MXN".`,
    langCheckFormatDate: (docName: string, found: string) =>
      `Formato de fecha en ingles en ${docName}: "${found}". Usar formato espanol.`,
    langCheckTitlePass: (n: number, total: number) =>
      `Titulo identico en ${n}/${total} documentos.`,
    langCheckTitleMismatch: (n: number, list: string) =>
      `El titulo no coincide en ${n} documento(s): ${list}. Corrige antes de exportar.`,
    langCheckDismiss: 'Ignorar advertencia',
    langCheckDismissAll: 'Ignorar todas las advertencias',
    langCheckNoAnglicisms: 'Sin anglicismos detectados',
    langCheckNoFormatIssues: 'Sin problemas de formato',
    langCheckTitleConsistent: 'Titulo consistente en todos los documentos',

    // Export progress
    progressStep1Label: 'Verificacion de idioma',
    progressStep1Running: 'Verificando idioma y formatos...',
    progressStep1Complete: 'Sin problemas de idioma',
    progressStep2Label: 'Generando PDFs',
    progressStep2Running: (current: number, total: number) =>
      `Generando PDFs... (${current}/${total})`,
    progressStep2Complete: (total: number) => `${total} PDFs generados`,
    progressStep3Label: 'Descargando documentos subidos',
    progressStep3Running: (current: number, total: number) =>
      `Descargando archivos... (${current}/${total})`,
    progressStep3Complete: (total: number) => `${total} archivos descargados`,
    progressStep4Label: 'Compilando ZIP',
    progressStep4Running: 'Compilando carpeta...',
    progressStep4Complete: 'Carpeta compilada',
    progressComplete: 'Listo',
    progressAutoDownload: 'La carpeta se descargo automaticamente.',
    progressError: (msg: string) => `Error al exportar: ${msg}. Intenta de nuevo.`,
    progressRetry: 'Reintentar exportacion',

    // Download card
    downloadToast: (filename: string) => `Carpeta descargada: ${filename}`,
    downloadRedownload: 'Descargar de nuevo',
    downloadMeta: (filename: string, sizeMB: string) => `${filename} (${sizeMB} MB)`,
    downloadDate: (date: string) => `Generada el ${date}`,

    // Blocked modal
    blockedModalTitle: 'Exportacion bloqueada',
    blockedModalBody: 'Resuelve los siguientes problemas antes de exportar la carpeta.',
    blockedModalFixLink: 'Ir al campo',
    blockedModalClose: 'Cerrar',

    // Warnings panel
    warningsPanelHeading: 'Advertencias',
    warningsPanelBody: 'Estas advertencias no bloquean la exportacion, pero revisa antes de enviar a IMCINE.',
    warningsDismiss: 'Ignorar',
    warningsDismissAll: 'Ignorar todas',

    // Error states
    errorPdfGeneration: (docName: string) =>
      `Error al generar ${docName}. La exportacion continua con los demas documentos.`,
    errorFileFetch: (filename: string) =>
      `No se pudo descargar ${filename} de almacenamiento. Verifica tu conexion.`,
    errorZipCompilation: 'Error al compilar la carpeta. El proyecto puede ser demasiado grande. Intenta de nuevo o contacta soporte.',
    errorLangCheckTimeout: 'La verificacion de idioma tardo demasiado. Se omitio. Puedes exportar sin esta verificacion.',
    errorNoDocs: 'Genera los documentos primero. Completa los datos y usa "Generar carpeta" en la pantalla de generacion.',
    errorBlockersResolved: 'Todos los bloqueadores resueltos. Ya puedes exportar.',

    // Upload validation
    uploadErrorNotPdf: (tipo: string) => `${tipo}: El archivo no es PDF.`,
    uploadErrorTooLarge: (tipo: string, sizeMB: string) => `${tipo}: El archivo excede 40 MB (${sizeMB} MB).`,
    uploadErrorFetchFailed: (tipo: string) => `${tipo}: No se pudo descargar el archivo.`,
  },

  // -- Auth --
  auth: {
    loginTitle: 'Carpetify',
    loginSubtitle: 'Generador de Carpetas EFICINE',
    loginDescription: 'Herramienta interna de Lemon Studios para generar el expediente completo de solicitud EFICINE Art. 189.',
    loginButton: 'Iniciar sesion con Google',
    loginLoading: 'Iniciando sesion...',
    loginError: 'Error al iniciar sesion. Intenta de nuevo.',
    logoutButton: 'Cerrar sesion',
    loadingAuth: 'Verificando sesion...',
    userMenuLabel: 'Menu de usuario',
    orgSetupTitle: 'Crear organizacion',
    orgSetupDescription: 'Antes de continuar, crea tu organizacion. Todos los proyectos y configuraciones se guardaran bajo esta organizacion.',
    orgSetupNameLabel: 'Nombre de la organizacion',
    orgSetupNamePlaceholder: 'Ej. Lemon Studios',
    orgSetupButton: 'Crear organizacion',
    orgSetupCreating: 'Creando organizacion...',
    orgSetupError: 'Error al crear la organizacion. Intenta de nuevo.',
    migrationInProgress: 'Migrando datos existentes...',
    migrationComplete: 'Datos migrados exitosamente.',
    migrationError: 'Error al migrar datos. Contacta soporte.',
  },

  // -- RBAC (Role-Based Access Control) --
  rbac: {
    roles: {
      productor: 'Productor',
      line_producer: 'Line Producer',
      abogado: 'Abogado',
      director: 'Director',
    },
    accessDenied: {
      title: 'No tienes acceso a este proyecto',
      description: 'Solicita acceso al productor del proyecto para poder visualizarlo.',
      backButton: 'Volver a Mis Proyectos',
    },
    loadingAccess: 'Verificando acceso...',
    readOnly: {
      banner: (productorName: string) =>
        `Solo lectura \u2014 contacta a ${productorName} para editar.`,
    },
    team: {
      title: 'Equipo del Proyecto',
      owner: 'Propietario',
      removeButton: 'Revocar acceso',
      removeCancel: 'Cancelar',
      removing: 'Revocando...',
      removeConfirm: (name: string) =>
        `Se eliminara a ${name} del proyecto. Esta accion no se puede deshacer.`,
      removedToast: 'Acceso revocado exitosamente.',
      pendingStatus: 'Pendiente',
    },
    invite: {
      title: 'Invitar al proyecto',
      emailLabel: 'Correo electronico',
      emailPlaceholder: 'ejemplo@correo.com',
      roleLabel: 'Rol',
      sendButton: 'Enviar invitacion',
      sending: 'Enviando invitacion...',
      successToast: 'Invitacion enviada exitosamente.',
      errorToast: 'Error al enviar la invitacion. Intenta de nuevo.',
      alreadyInvited: 'Ya existe una invitacion pendiente para este correo.',
      alreadyMember: 'Este usuario ya es miembro del proyecto.',
    },
    pending: {
      title: 'Invitaciones pendientes',
      invitedBy: (name: string) => `Invitado por ${name}`,
      acceptButton: 'Aceptar',
      declineButton: 'Rechazar',
      noInvitations: 'No tienes invitaciones pendientes.',
      acceptedToast: 'Invitacion aceptada. Ya puedes acceder al proyecto.',
      declinedToast: 'Invitacion rechazada.',
    },
  },

  // -- Collaboration (Presence & Locking) --
  collaboration: {
    // Lock messages per D-16
    lockMessage: (name: string, role: string) =>
      `Esta seccion esta siendo editada por ${name} (${role}). Puedes ver los datos pero no editarlos hasta que termine.`,
    // Force-break per D-04
    forceBreak: 'Desbloquear',
    forceBreakConfirmTitle: 'Desbloquear seccion',
    forceBreakConfirmBody: (name: string, role: string) =>
      `${name} (${role}) tiene esta seccion bloqueada. Los cambios no guardados se perderan. ¿Desbloquear?`,
    forceBreakConfirm: 'Desbloquear',
    forceBreakCancel: 'Cancelar',
    forceBreakSuccess: 'Seccion desbloqueada.',
    forceBreakError: 'No se pudo desbloquear la seccion.',
    // Lock lifecycle
    lockAcquired: 'Seccion bloqueada para edicion.',
    lockReleased: 'Edicion finalizada.',
    lockFailed: 'No se pudo bloquear la seccion. Otro usuario la esta editando.',
    finishEditing: 'Terminar edicion',
    startEditing: 'Editar',
    // Presence labels per D-05, D-06, D-07
    presence: {
      online: 'En linea',
      idle: 'Inactivo',
      viewing: (screen: string) => `Viendo ${screen}`,
      editing: (screen: string) => `Editando ${screen}`,
    },
  },

  // -- Error States --
  errors: {
    firestoreConnection:
      'No se pudo conectar con el servidor. Verifica tu conexion a internet e intenta de nuevo.',
    fileUpload:
      'Error al subir el archivo. Verifica que sea un PDF valido y menor a 40 MB.',
    generic:
      'Ocurrio un error inesperado. Intenta de nuevo o recarga la pagina.',
  },
} as const
