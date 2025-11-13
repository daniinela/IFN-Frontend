import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboards por rol
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard'
import CoordGeorefDashboard from './pages/coordgeoref/CoordGeorefDashboard';
import CoordBrigadasDashboard from './pages/coordbrigadas/CoordBrigadasDashboard';
import RevisionSolicitudes from './pages/coordbrigadas/RevisionSolicitudes';
// Super Admin
import GenerarYAsignar from './pages/superadmin/GenerarYAsignar';

// Coord Georef
import MisConglomerados from './pages/coordgeoref/MisConglomerados';

// Coord Brigadas
import Brigadas from './pages/coordbrigadas/Brigadas';
import Brigadistas from './pages/coordbrigadas/Brigadistas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas protegidas con Layout único */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin', 'coord_georef', 'coord_brigadas', 'brigadista']} />}>
          <Route element={<DashboardLayout />}>
            
            {/* DASHBOARDS SEPARADOS POR ROL */}
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/coord-georef/dashboard" element={<CoordGeorefDashboard />} />
            <Route path="/coord-brigadas/dashboard" element={<CoordBrigadasDashboard />} />
            
            {/* Super Admin - Rutas adicionales */}
            <Route path="/generar-asignar" element={<GenerarYAsignar />} />
            
            {/* Coord Georef - Rutas adicionales */}
            <Route path="/mis-conglomerados" element={<MisConglomerados />} />
            
            {/* Coord Brigadas - Rutas adicionales */}
            <Route path="/revision-solicitudes" element={<RevisionSolicitudes />} />
            <Route path="/brigadas" element={<Brigadas />} />
            <Route path="/brigadistas" element={<Brigadistas />} />
            
          </Route>
        </Route>

        {/* Redireccionamientos */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;