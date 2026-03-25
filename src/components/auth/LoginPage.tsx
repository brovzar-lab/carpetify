import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { Moon, Sun, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { es } from '@/locales/es'

const STORAGE_KEY = 'carpetify-theme'

function getInitialDark(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function LoginPage() {
  const { signInWithGoogle, devBypassLogin, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)

  // Initialize dark mode from localStorage / system preference
  useEffect(() => {
    const initial = getInitialDark()
    setDark(initial)
    document.documentElement.classList.toggle('dark', initial)
  }, [])

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
      return next
    })
  }, [])

  const handleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      // Navigation handled by useEffect above when user state changes
    } catch {
      toast.error(es.auth.loginError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background text-foreground">
      {/* Dark mode toggle — top-right corner */}
      <button
        onClick={toggleDark}
        title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="fixed top-3 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Login card */}
      <div className="mx-auto w-full max-w-sm space-y-8 px-4">
        {/* Branding */}
        <div className="text-center">
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Lemon Studios
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            {es.auth.loginTitle}
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            {es.auth.loginSubtitle}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {es.auth.loginDescription}
          </p>
        </div>

        {/* Sign-in button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {es.auth.loginLoading}
            </>
          ) : (
            es.auth.loginButton
          )}
        </Button>

        {/* Dev-only bypass — anonymous auth for quick testing */}
        {import.meta.env.DEV && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={async () => {
              setLoading(true)
              try {
                await devBypassLogin()
              } catch {
                toast.error('Dev bypass failed')
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
          >
            Acceso sin Google (solo desarrollo)
          </Button>
        )}
      </div>
    </div>
  )
}
