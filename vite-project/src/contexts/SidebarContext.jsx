import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import MessagesApiService from '../services/MessagesApiService';
import IncidentApiService from '../services/IncidentApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import PdfDocumentApiService from '../services/PdfDocumentApiService';
import { useStateContext } from './ContextProvider';

const SidebarContext = createContext({
  unreadCount: 0,
  pendingIncidentsCount: 0,
  isMandoEspecial: false,
  hasNewPdf: false,
  refreshSidebarData: () => {},
});

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

export const SidebarProvider = ({ children }) => {
  const { user } = useStateContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingIncidentsCount, setPendingIncidentsCount] = useState(0);
  const [isMandoEspecial, setIsMandoEspecial] = useState(false);
  const [hasNewPdf, setHasNewPdf] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllData = useCallback(async (force = false) => {
    if (!user) return;
    
    // Si no es forzado y tenemos datos recientes, no hacer nada
    if (!force && lastFetch && Date.now() - lastFetch < CACHE_DURATION) {
      return;
    }

    // Evitar múltiples llamadas simultáneas
    if (isLoading) return;
    
    setIsLoading(true);

    try {
      // Ejecutar todas las llamadas en paralelo
      const promises = [
        MessagesApiService.getInbox().catch(() => ({ data: [] })),
        IncidentApiService.countPending().catch(() => ({ data: { pending: 0 } })),
        UsuariosApiService.checkMandoEspecial(user.id_empleado).catch(() => ({ data: { mando_especial: false } })),
      ];

      // Solo agregar PDF si es jefe o mando
      if (user.type === 'jefe' || user.type === 'mando') {
        promises.push(
          PdfDocumentApiService.getLatestStatus().catch(() => ({ data: { has_new: false } }))
        );
      }

      const results = await Promise.all(promises);

      // Procesar resultados
      const [messagesRes, incidentsRes, mandoRes, pdfRes] = results;

      setUnreadCount(messagesRes.data?.filter?.(m => !m.is_read)?.length || 0);
      setPendingIncidentsCount(incidentsRes.data?.pending || 0);
      setIsMandoEspecial(mandoRes.data?.mando_especial || false);
      
      if (pdfRes) {
        setHasNewPdf(pdfRes.data?.has_new || false);
      }

      setLastFetch(Date.now());
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, lastFetch, isLoading]);

  // Cargar datos cuando el usuario cambia
  useEffect(() => {
    if (user) {
      fetchAllData(true); // Forzar carga inicial
    }
  }, [user?.id_empleado]);

  // Función para refrescar manualmente (ej: después de leer un mensaje)
  const refreshSidebarData = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  return (
    <SidebarContext.Provider
      value={{
        unreadCount,
        pendingIncidentsCount,
        isMandoEspecial,
        hasNewPdf,
        refreshSidebarData,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);