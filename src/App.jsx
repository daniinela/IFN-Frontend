// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// COORD_IFN
import CoordDashboard from './pages/coord_ifn/Dashboard';
import GestionConglomerados from './pages/coord_ifn/GestionConglomerados';
import AsignacionMisiones from './pages/coord_ifn/AsignacionMisiones';
import MonitoreoGlobal from './pages/coord_ifn/MonitoreoGlobal';

// GESTOR_RECURSOS
import GestorDashboard from './pages/gestor_recursos/Dashboard';
import GestionPersonal from './pages/gestor_recursos/GestionPersonal';

// JEFE_BRIGADA
import JefeDashboard from './pages/jefe_brigada/Dashboard';
import MisMisiones from './pages/jefe_brigada/MisMisiones';
import RutasAcceso from './pages/jefe_brigada/RutasAcceso';
import EstablecimientoSubparcelas from './pages/jefe_brigada/EstablecimientoSubparcelas';

// BRIGADISTAS
import DashboardBrigadista from './pages/brigadista/DashboardBrigadista';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* COORD_IFN */}
        <Route 
          path="/coord-ifn" 
          element={
            <ProtectedRoute allowedRoles={['COORD_IFN']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<CoordDashboard />} />
          <Route path="gestion-conglomerados" element={<GestionConglomerados />} />
          <Route path="asignacion-misiones" element={<AsignacionMisiones />} />
          <Route path="monitoreo-global" element={<MonitoreoGlobal />} />
        </Route>
        
        {/* GESTOR_RECURSOS */}
        <Route 
          path="/gestor-recursos" 
          element={
            <ProtectedRoute allowedRoles={['GESTOR_RECURSOS']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<GestorDashboard />} />
          <Route path="gestion-personal" element={<GestionPersonal />} />
        </Route>
        
        {/* JEFE_BRIGADA */}
        <Route 
          path="/jefe-brigada" 
          element={
            <ProtectedRoute allowedRoles={['JEFE_BRIGADA']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<JefeDashboard />} />
          <Route path="mis-misiones" element={<MisMisiones />} />
          <Route path="rutas-acceso" element={<RutasAcceso />} />
          <Route path="establecimiento-subparcelas" element={<EstablecimientoSubparcelas />} />
        </Route>

        {/* 🆕 BRIGADISTAS (Botanico, Tecnico Auxiliar, Coinvestigador) */}
        <Route 
          path="/brigadista" 
          element={
            <ProtectedRoute allowedRoles={['BOTANICO', 'TECNICO_AUX', 'COINVESTIGADOR']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardBrigadista />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;