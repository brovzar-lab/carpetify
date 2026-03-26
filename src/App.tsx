import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { WizardShell } from '@/components/wizard/WizardShell'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { ERPISettingsPage } from '@/components/erpi/ERPISettingsPage'
import { AppHeader } from '@/components/layout/AppHeader'
import { LoginPage } from '@/components/auth/LoginPage'
import { OrgSetupPage } from '@/components/auth/OrgSetupPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { InvitationPage } from '@/pages/InvitationPage'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { es } from '@/locales/es'

/**
 * Route guard for /setup: only renders if user is authenticated but has no org.
 * Redirects to /login if not authenticated, to / if org already exists.
 */
function OrgSetupRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, needsOrgSetup } = useAuth()

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

  if (!user) return <Navigate to="/login" replace />
  if (!needsOrgSetup) return <Navigate to="/" replace />

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<OrgSetupRoute><OrgSetupPage /></OrgSetupRoute>} />
          <Route path="/invitaciones/:invitationId" element={<InvitationPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppHeader>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/project/:projectId" element={<WizardShell />} />
                    <Route path="/project/:projectId/:screen" element={<WizardShell />} />
                    <Route path="/erpi" element={<ERPISettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppHeader>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
