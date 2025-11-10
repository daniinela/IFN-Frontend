// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import SuperAdminLayout from './components/SuperAdminLayout';
import AdminLayout from './components/AdminLayout'; // Para otros roles

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Super Admin
//import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import GenerarYAsignar from './pages/SuperAdmin/GenerarYAsignar';

// Shared (otros módulos existentes - mantenlos como estaban)
import Dashboard from './pages/shared/Dashboard';
import Brigadistas from './pages/shared/Brigadistas';
import Brigadas from './pages/shared/Brigadas';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />
        <Route path="/register/:token" element={<Register />} />

        {/* Super Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/generar-asignar" element={<GenerarYAsignar />} />
            <Route path="/superadmin/usuarios" element={<div>Usuarios (por crear)</div>} />
            <Route path="/superadmin/reportes" element={<div>Reportes (por crear)</div>} />
          </Route>
        </Route>

        {/* Coordinador de Georreferenciación (por crear) */}
        <Route element={<ProtectedRoute allowedRoles={['coord_georef']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/coordgeoref/dashboard" element={<div>Dashboard Coord Georef</div>} />
          </Route>
        </Route>

        {/* Coordinador de Brigadas (por crear) */}
        <Route element={<ProtectedRoute allowedRoles={['coord_brigadas']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/coordbrigadas/dashboard" element={<div>Dashboard Coord Brigadas</div>} />
          </Route>
        </Route>

        {/* Admin Routes (ANTIGUAS - Mantenerlas temporalmente) */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin', 'coord_georef', 'coord_brigadas']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/brigadistas" element={<Brigadistas />} />
            <Route path="/admin/brigadas" element={<Brigadas />} />
          </Route>
        </Route>

        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;