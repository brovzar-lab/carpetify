import type { WizardScreen } from '@/stores/wizardStore'

/**
 * Project-level role type. Roles are per-project, not global.
 * A user can be 'productor' on Project A and 'abogado' on Project B.
 * Per D-01: screen-level permissions, not field-level.
 */
export type ProjectRole = 'productor' | 'line_producer' | 'abogado' | 'director'

/**
 * Permission set for a single role.
 * Per D-02: defines which wizard screens a role can edit/view,
 * and which global actions (pipeline, export, team, delete) are allowed.
 */
interface RolePermissions {
  editableScreens: WizardScreen[]
  viewableScreens: WizardScreen[]
  canRunPipeline: boolean
  canExport: boolean
  canManageTeam: boolean
  canDeleteProject: boolean
}

/** All 8 wizard screens for convenience */
const ALL_SCREENS: WizardScreen[] = [
  'datos',
  'guion',
  'equipo',
  'financiera',
  'documentos',
  'generacion',
  'validacion',
  'exportar',
]

/**
 * Permission matrix for all 4 project roles.
 * Matches D-02 from 11-CONTEXT.md exactly.
 *
 * productor: full access to everything
 * line_producer: edits datos, financiera, documentos, generacion; can run pipeline and export
 * abogado: edits documentos only; view-only everything else
 * director: edits guion and equipo; view-only everything else
 */
export const ROLE_PERMISSIONS: Record<ProjectRole, RolePermissions> = {
  productor: {
    editableScreens: [...ALL_SCREENS],
    viewableScreens: [...ALL_SCREENS],
    canRunPipeline: true,
    canExport: true,
    canManageTeam: true,
    canDeleteProject: true,
  },
  line_producer: {
    editableScreens: ['datos', 'financiera', 'documentos', 'generacion'],
    viewableScreens: [...ALL_SCREENS],
    canRunPipeline: true,
    canExport: true,
    canManageTeam: false,
    canDeleteProject: false,
  },
  abogado: {
    editableScreens: ['documentos'],
    viewableScreens: [...ALL_SCREENS],
    canRunPipeline: false,
    canExport: false,
    canManageTeam: false,
    canDeleteProject: false,
  },
  director: {
    editableScreens: ['guion', 'equipo'],
    viewableScreens: [...ALL_SCREENS],
    canRunPipeline: false,
    canExport: false,
    canManageTeam: false,
    canDeleteProject: false,
  },
}

/** Returns true if the given role can edit the specified wizard screen. */
export function canEditScreen(role: ProjectRole, screen: WizardScreen): boolean {
  return ROLE_PERMISSIONS[role].editableScreens.includes(screen)
}

/** Returns true if the given role can view the specified wizard screen. */
export function canViewScreen(role: ProjectRole, screen: WizardScreen): boolean {
  return ROLE_PERMISSIONS[role].viewableScreens.includes(screen)
}

/** Returns true if the given role can trigger the AI generation pipeline. */
export function canRunPipeline(role: ProjectRole): boolean {
  return ROLE_PERMISSIONS[role].canRunPipeline
}

/** Returns true if the given role can export the carpeta ZIP. */
export function canExport(role: ProjectRole): boolean {
  return ROLE_PERMISSIONS[role].canExport
}

/** Returns true if the given role can invite/remove team members. */
export function canManageTeam(role: ProjectRole): boolean {
  return ROLE_PERMISSIONS[role].canManageTeam
}

/** Returns true if the given role can permanently delete the project. */
export function canDeleteProject(role: ProjectRole): boolean {
  return ROLE_PERMISSIONS[role].canDeleteProject
}
