import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStateContext } from '../contexts/ContextProvider.jsx';

const ProtectedRoute = ({ element, rolesAllowed = [] }) => {
  const { user, token, isLoading } = useStateContext();



  if (isLoading) {
    return <div>Cargando...</div>; // Mostrar un indicador de carga
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (rolesAllowed.length > 0 && !rolesAllowed.includes(user?.role_name)) {
    
    return <Navigate to="/dashboard" replace />;
  }

  return element; 
};

export default ProtectedRoute;
