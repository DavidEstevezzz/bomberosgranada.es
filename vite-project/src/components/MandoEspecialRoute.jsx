import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useStateContext } from '../contexts/ContextProvider';
import UsuariosApiService from '../services/UsuariosApiService';

const MandoEspecialRoute = ({ element }) => {
  const { user, token, isLoading: contextLoading } = useStateContext(); // Obtener token (no userToken)
  const [loading, setLoading] = useState(true);
  const [isMandoEspecial, setIsMandoEspecial] = useState(false);

  useEffect(() => {
    // Solo ejecutar cuando el contexto haya terminado de cargar
    if (!contextLoading) {
      const checkMandoEspecial = async () => {
        try {
          if (user) {
            console.log("Usuario encontrado en contexto:", user.id_empleado);
            const response = await UsuariosApiService.checkMandoEspecial(user.id_empleado);
            console.log("Respuesta mando especial:", response.data);
            setIsMandoEspecial(response.data.mando_especial);
          } else {
            console.log("No hay usuario en el contexto");
          }
        } catch (error) {
          console.error('Error al verificar si el usuario es mando especial:', error);
          setIsMandoEspecial(false);
        } finally {
          setLoading(false);
        }
      };
      
      if (token) {
        checkMandoEspecial();
      } else {
        setLoading(false);
      }
    }
  }, [user, token, contextLoading]);

  // Muestra un indicador de carga mientras el contexto o el componente están cargando
  if (contextLoading || loading) {
    return <div className="flex items-center justify-center h-screen">Verificando permisos...</div>;
  }

  // Redirigir a login si no hay token
  if (!token) {
    console.log("No hay token, redirigiendo a login");
    return <Navigate to="/login" />;
  }

  // Redirigir al dashboard si el usuario no es mando especial
  if (!isMandoEspecial) {
    console.log("Usuario no es mando especial, redirigiendo a dashboard");
    return <Navigate to="/dashboard" />;
  }

  console.log("Usuario es mando especial, mostrando componente");
  return element;
};

export default MandoEspecialRoute;