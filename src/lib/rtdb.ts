/**
 * RTDB path helpers for real-time collaboration.
 * Centralizes path construction to prevent typos and ensure consistency
 * across presence and lock hooks.
 */

/** Path for a single user's presence entry within a project. */
export function presencePath(projectId: string, userId: string): string {
  return `presence/${projectId}/${userId}`
}

/** Path for the lock on a specific wizard screen within a project. */
export function lockPath(projectId: string, screenId: string): string {
  return `locks/${projectId}/${screenId}`
}

/** Path for all presence entries within a project (parent node). */
export function projectPresencePath(projectId: string): string {
  return `presence/${projectId}`
}
