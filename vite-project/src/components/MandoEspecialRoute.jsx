import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useStateContext } from '../contexts/ContextProvider';
import UsuariosApiService from '../services/UsuariosApiService';

/**
 * Componente que protege rutas para que solo sean accesibles por usuarios con mando_especial=true
 */
const MandoEspecialRoute = ({ element }) => {
  const { user } = useStateContext();
  const [loading, setLoading] = useState(true);
  const [isMandoEspecial, setIsMandoEspecial] = useState(false);

  useEffect(() => {
    const checkMandoEspecial = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await UsuariosApiService.checkMandoEspecial(user.id_empleado);
        setIsMandoEspecial(response.data.mando_especial);
      } catch (error) {
        console.error('Error al verificar si el usuario es mando especial:', error);
        setIsMandoEspecial(false);
      } finally {
        setLoading(false);
      }
    };

    checkMandoEspecial();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Verificando permisos...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isMandoEspecial) {
    return <Navigate to="/dashboard" />;
  }

  return element;
};

export default MandoEspecialRoute;