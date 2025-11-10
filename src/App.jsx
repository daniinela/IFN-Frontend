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

// Super Admin
import GenerarYAsignar from './pages/superadmin/GenerarYAsignar';

// Coord Georef
import MisConglomerados from './pages/coordgeoref/MisConglomerados';

// Coord Brigadas
import Brigadas from './pages/coordbrigadas/Brigadas';
import Brigadistas from './pages/coordbrigadas/Brigadistas';


// Componente selector de dashboard inline
function DashboardSelector() {
  const activeRole = localStorage.getItem('active-role');
  
  if (activeRole === 'super_admin') {
    return <SuperAdminDashboard />;
  }
  
  if (activeRole === 'coord_georef') {
    return <CoordGeorefDashboard />;
  }
  
  if (activeRole === 'coord_brigadas') {
    return <CoordBrigadasDashboard />;
  }
  
  // Si no hay rol válido, redirigir al login
  return <Navigate to="/login" replace />;
}

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
            
            {/* Dashboard dinámico según rol */}
            <Route path="/dashboard" element={<DashboardSelector />} />
            
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;