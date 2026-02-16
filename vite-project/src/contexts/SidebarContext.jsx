import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const SidebarProvider = ({ children }) => {
  const { user } = useStateContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingIncidentsCount, setPendingIncidentsCount] = useState(0);
  const [isMandoEspecial, setIsMandoEspecial] = useState(false);
  const [hasNewPdf, setHasNewPdf] = useState(false);
  
  // Usar refs para evitar re-renders y llamadas duplicadas
  const lastFetchRef = useRef(null);
  const isLoadingRef = useRef(false);
  const lastUserIdRef = useRef(null);

  const fetchAllData = async (force = false) => {
    if (!user) return;
    
    // Si no es forzado y tenemos datos recientes, no hacer nada
    const now = Date.now();
    if (!force && lastFetchRef.current && (now - lastFetchRef.current) < CACHE_DURATION) {
      console.log('SidebarContext: usando cache, faltan', Math.round((CACHE_DURATION - (now - lastFetchRef.current)) / 1000), 'segundos');
      return;
    }

    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      console.log('SidebarContext: ya hay una carga en progreso');
      return;
    }
    
    isLoadingRef.current = true;
    console.log('SidebarContext: cargando datos...');

    try {
      const promises = [
        MessagesApiService.getInbox().catch(() => ({ data: [] })),
        IncidentApiService.countPending().catch(() => ({ data: { pending: 0 } })),
        UsuariosApiService.checkMandoEspecial(user.id_empleado).catch(() => ({ data: { mando_especial: false } })),
      ];

      if (user.type === 'jefe' || user.type === 'mando') {
        promises.push(
          PdfDocumentApiService.getLatestStatus().catch(() => ({ data: { has_new: false } }))
        );
      }

      const results = await Promise.all(promises);
      const [messagesRes, incidentsRes, mandoRes, pdfRes] = results;

      setUnreadCount(messagesRes.data?.filter?.(m => !m.is_read)?.length || 0);
      setPendingIncidentsCount(incidentsRes.data?.pending || 0);
      setIsMandoEspecial(mandoRes.data?.mando_especial || false);
      
      if (pdfRes) {
        setHasNewPdf(pdfRes.data?.has_new || false);
      }

      lastFetchRef.current = Date.now();
      console.log('SidebarContext: datos cargados correctamente');
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  // Solo ejecutar cuando cambia el usuario
  useEffect(() => {
    if (user && user.id_empleado !== lastUserIdRef.current) {
      lastUserIdRef.current = user.id_empleado;
      lastFetchRef.current = null; // Resetear cache para nuevo usuario
      fetchAllData(true);
    }
  }, [user]);

  const refreshSidebarData = () => {
    fetchAllData(true);
  };

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