import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { es } from '@/locales/es'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Block render until auth state is known (prevents flash -- Pitfall #7)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">{es.auth.loadingAuth}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Preserve intended destination for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
