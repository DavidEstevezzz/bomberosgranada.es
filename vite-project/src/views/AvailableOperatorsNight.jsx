import React from 'react';
import SortableFirefightersList from '../components/SortableFirefightersList';
import AssignmentsApiService from '../services/AssignmentsApiService';

const AvailableFirefighters2 = () => {
  const fetchAvailableFirefighters = (date) => {
    return AssignmentsApiService.getAvailableFirefightersNoTodayAndTomorrow(date); // Pasar la fecha al servicio
  };

  return (
    <SortableFirefightersList
      title="Lista de Requerimientos Operadores Noche"
      fetchData={fetchAvailableFirefighters} // Función corregida para manejar fecha
      listType="firefighters by order"
      orderColumn="orden"
    />
  );
};

export default AvailableFirefighters2;
