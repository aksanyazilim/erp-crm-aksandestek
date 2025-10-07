import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  console.log('🛡️ ProtectedRoute check:', {
    userRole: user.role,
    requiredRole: requiredRole,
    hasUser: !!user
  });

  // Eğer requiredRole belirtilmemişse, tüm authenticated kullanıcılara izin ver
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Basit rol kontrolü
  const hasRequiredRole = Array.isArray(requiredRole) 
    ? requiredRole.includes(user.role)
    : user.role === requiredRole;

  console.log('🔐 Role check result:', {
    hasRequiredRole,
    userRole: user.role,
    requiredRole
  });

  if (!hasRequiredRole) {
    console.log('🚫 Access denied - Redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;