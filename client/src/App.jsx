import './App.css'

import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import "./App.css"
import ForgotPassword from './pages/ForgotPassword'

function App() {
  return (
    
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          
          <Route path="/" element={<Home />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
