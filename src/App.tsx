import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TicketProvider } from './contexts/TicketContext';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import NewTicket from './pages/NewTicket';
import Companies from './pages/Companies';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Unauthorized from './pages/Unauthorized';
import CompanyManagement from './components/common/CompanyManagement';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Dashboard - Sadece Admin */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* TicketList - Tüm kullanıcılar (role-based içerik) */}
      <Route path="/tickets" element={
        <ProtectedRoute>
          <Layout>
            <TicketList />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* NewTicket - Admin ve Customer */}
      <Route path="/new-ticket" element={
        <ProtectedRoute requiredRole={['admin', 'customer']}>
          <Layout>
            <NewTicket />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Companies - Sadece Admin */}
      <Route path="/companies" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <Companies />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Reports - Admin ve Support */}
      <Route path="/reports" element={
        <ProtectedRoute requiredRole={['admin', 'support']}>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Profile - Tüm kullanıcılar */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Settings - Tüm kullanıcılar */}
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      {/* Firma Yönetimi route'u ekleyelim */}
      <Route path="/companies" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <CompanyManagement />
          </Layout>
        </ProtectedRoute>
      } />
      {/* Default redirect - Role göre yönlendirme */}
      <Route path="/" element={<HomeRedirect />} />
    </Routes>
  );
};

// Role göre ana sayfa yönlendirmesi
const HomeRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.role) {
    case 'admin':
      return <Navigate to="/dashboard" replace />;
    case 'support':
    case 'customer':
    default:
      return <Navigate to="/tickets" replace />;
  }
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <TicketProvider>
        <Router>
          <AppRoutes />
        </Router>
      </TicketProvider>
    </AuthProvider>
  );
};

export default App;