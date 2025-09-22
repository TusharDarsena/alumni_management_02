import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const ProtectedRoute: React.FC<{ roles?: string[] }> = ({ roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
