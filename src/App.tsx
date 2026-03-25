import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { WizardShell } from '@/components/wizard/WizardShell'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { ERPISettingsPage } from '@/components/erpi/ERPISettingsPage'
import { AppHeader } from '@/components/layout/AppHeader'
import { LoginPage } from '@/components/auth/LoginPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
