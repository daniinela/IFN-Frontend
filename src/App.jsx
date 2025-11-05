import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pagess/login/Login';
import AdminLayout from './pagess/admin/Layout';  
import Dashboard from './pagess/admin/Dashboard';      
import Conglomerados from './pagess/admin/Conglomerados';
import Brigadas from './pagess/admin/Brigadas';
import Brigadistas from './pagess/admin/Brigadistas';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas de Admin */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'coord_georef', 'coord_brigadas']} />
          }
        >
          <Route element={<AdminLayout />}>
            {/* Dashboard - Todos los roles */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Conglomerados - Solo coord_georef y super_admin */}
            <Route 
              path="conglomerados" 
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'coord_georef']}>
                  <Conglomerados />
                </ProtectedRoute>
              } 
            />
            
            {/* Brigadas - Solo coord_brigadas y super_admin */}
            <Route 
              path="brigadas" 
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'coord_brigadas']}>
                  <Brigadas />
                </ProtectedRoute>
              } 
            />
            
            {/* Brigadistas - Solo coord_brigadas y super_admin */}
            <Route 
              path="brigadistas" 
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'coord_brigadas']}>
                  <Brigadistas />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Route>

        {/* Redirect raíz a login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;