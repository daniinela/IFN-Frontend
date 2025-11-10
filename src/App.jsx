import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import RoleBasedDashboard from './pages/shared/RoleBasedDashboard';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Super Admin
import GenerarYAsignar from './pages/superadmin/GenerarYAsignar';

// Coord Georef
import MisConglomerados from './pages/coordgeoref/MisConglomerados';

// Coord Brigadas
import Brigadas from './pages/coordbrigadas/Brigadas';
import Brigadistas from './pages/coordbrigadas/Brigadistas';

// Shared
import NotFound from './pages/shared/NotFound';

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
            
            {/* Dashboard dinámico (cambia según el rol) */}
            <Route path="/dashboard" element={<RoleBasedDashboard />} />
            
            {/* Super Admin */}
            <Route path="/generar-asignar" element={<GenerarYAsignar />} />
            
            {/* Coord Georef */}
            <Route path="/mis-conglomerados" element={<MisConglomerados />} />
            
            {/* Coord Brigadas */}
            <Route path="/brigadas" element={<Brigadas />} />
            <Route path="/brigadistas" element={<Brigadistas />} />
            
          </Route>
        </Route>

        {/* Redireccionamientos */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;