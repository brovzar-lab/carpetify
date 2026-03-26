import { Link } from 'react-router'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { es } from '@/locales/es'

/**
 * Access denied page shown when a user navigates to a project they are not a member of.
 * Per D-16: clean page with "No tienes acceso a este proyecto" message and back link.
 */
export function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold">
          {es.rbac.accessDenied.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {es.rbac.accessDenied.description}
        </p>
        <Button render={<Link to="/" />}>
          {es.rbac.accessDenied.backButton}
        </Button>
      </div>
    </div>
  )
}
