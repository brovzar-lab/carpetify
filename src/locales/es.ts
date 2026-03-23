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
