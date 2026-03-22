import { BrowserRouter, Routes, Route } from 'react-router'
import { WizardShell } from '@/components/wizard/WizardShell'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { ERPISettingsPage } from '@/components/erpi/ERPISettingsPage'
import { AppHeader } from '@/components/layout/AppHeader'

function App() {
  return (
    <BrowserRouter>
      <AppHeader>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/project/:projectId" element={<WizardShell />} />
          <Route path="/project/:projectId/:screen" element={<WizardShell />} />
          <Route path="/erpi" element={<ERPISettingsPage />} />
        </Routes>
      </AppHeader>
    </BrowserRouter>
  )
}

export default App
