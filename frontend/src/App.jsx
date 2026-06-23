import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductsPage from './pages/ProductsPage'
import AiChatPage from './pages/AiChatPage'
import AdminPage from './pages/AdminPage'
import Navbar from './components/Navbar'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return !token ? children : <Navigate to="/" replace />
}

const AdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem('admin_token')
  if (!adminToken) return children
  return children
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Navbar /><ProductsPage /></PrivateRoute>} />
        <Route path="/ai" element={<PrivateRoute><Navbar /><AiChatPage /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
