// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pagess/login/Login.jsx';
import Register from './pagess/register/Register.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// ADMIN
import AdminLayout from './pagess/admin/Layout.jsx';
import Dashboard from './pagess/admin/Dashboard.jsx';
import Conglomerados from './pagess/admin/Conglomerados.jsx';
import Brigadas from './pagess/admin/Brigadas.jsx';
import Brigadistas from './pagess/admin/Brigadistas.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirección por defecto al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* 🧩 Rutas protegidas para ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="conglomerados" element={<Conglomerados />} />
          <Route path="/admin/brigadas" element={<Brigadas />} />
          <Route path="/admin/brigadistas" element={<Brigadistas />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
