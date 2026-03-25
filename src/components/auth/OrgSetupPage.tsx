import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Moon, Sun, Loader2, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { httpsCallable } from 'firebase/functions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { createOrganization, createUserProfile } from '@/services/organizations'
import { functions } from '@/lib/firebase'
import { es } from '@/locales/es'

const STORAGE_KEY = 'carpetify-theme'

const orgNameSchema = z.object({
  name: z.string().min(1).max(100),
})

type OrgNameForm = z.infer<typeof orgNameSchema>

function getInitialDark(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function OrgSetupPage() {
  const { user, setOrgComplete } = useAuth()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [dark, setDark] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgNameForm>({
    defaultValues: { name: '' },
  })

  // Initialize dark mode from localStorage / system preference
  useEffect(() => {
    const initial = getInitialDark()
    setDark(initial)
    document.documentElement.classList.toggle('dark', initial)
  }, [])

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
      return next
    })
  }, [])

  const onSubmit = async (data: OrgNameForm) => {
    if (!user) return

    setCreating(true)
    try {
      // 1. Create org in Firestore
      const orgId = await createOrganization(data.name, user.uid)

      // 2. Create user profile
      await createUserProfile(
        user.uid,
        {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        },
        orgId,
      )

      // 3. Trigger v1.0 data migration Cloud Function
      setMigrating(true)
      try {
        const migrateV1Data = httpsCallable(functions, 'migrateV1Data')
        await migrateV1Data({ orgId })
        toast.success(es.auth.migrationComplete)
      } catch {
        // Migration failure is non-fatal: org is created, data can be migrated later
        console.error('v1.0 migration failed')
        toast.error(es.auth.migrationError)
      } finally {
        setMigrating(false)
      }

      // 4. Update auth context so ProtectedRoute stops redirecting to /setup
      setOrgComplete(orgId)

      // 5. Navigate to dashboard
      navigate('/', { replace: true })
    } catch {
      toast.error(es.auth.orgSetupError)
    } finally {
      setCreating(false)
    }
  }

  const isWorking = creating || migrating

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background text-foreground">
      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="fixed top-3 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Setup card */}
      <div className="mx-auto w-full max-w-sm space-y-8 px-4">
        {/* User info */}
        {user && (
          <div className="flex flex-col items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? ''}
                className="h-16 w-16 rounded-full border-2 border-border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-muted">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {user.displayName ?? user.email}
            </p>
          </div>
        )}

        {/* Title + description */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {es.auth.orgSetupTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {es.auth.orgSetupDescription}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-name" className="text-sm font-semibold">
              {es.auth.orgSetupNameLabel}
            </Label>
            <Input
              id="org-name"
              {...register('name', { required: true, minLength: 1, maxLength: 100 })}
              placeholder={es.auth.orgSetupNamePlaceholder}
              disabled={isWorking}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {es.auth.orgSetupNameLabel}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isWorking}
          >
            {migrating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {es.auth.migrationInProgress}
              </>
            ) : creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {es.auth.orgSetupCreating}
              </>
            ) : (
              es.auth.orgSetupButton
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
