import { BrowserRouter, Routes, Route } from 'react-router'

function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold">Mis Proyectos</h1>
      <p className="mt-4 text-muted-foreground">
        Crea tu primer proyecto para comenzar a armar tu carpeta EFICINE.
      </p>
    </div>
  )
}

function WizardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold">Datos del Proyecto</h1>
      <p className="mt-4 text-muted-foreground">
        Completa los datos basicos de tu proyecto cinematografico.
      </p>
    </div>
  )
}

function ERPISettingsPage() {
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
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/project/:projectId" element={<WizardPage />} />
        <Route path="/project/:projectId/:screen" element={<WizardPage />} />
        <Route path="/erpi" element={<ERPISettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
