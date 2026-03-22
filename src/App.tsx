import { BrowserRouter, Routes, Route } from 'react-router'
import { WizardShell } from '@/components/wizard/WizardShell'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { AppHeader } from '@/components/layout/AppHeader'

function ERPISettingsPagePlaceholder() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold">Datos ERPI</h1>
      <p className="mt-4 text-muted-foreground">
        Informacion de la empresa solicitante. Se comparte entre todos los proyectos.
      </p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppHeader>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/project/:projectId" element={<WizardShell />} />
          <Route path="/project/:projectId/:screen" element={<WizardShell />} />
          <Route path="/erpi" element={<ERPISettingsPagePlaceholder />} />
        </Routes>
      </AppHeader>
    </BrowserRouter>
  )
}

export default App
