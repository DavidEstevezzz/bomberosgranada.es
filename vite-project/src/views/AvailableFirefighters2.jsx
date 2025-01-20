import React from 'react';
import SortableFirefightersList from '../components/SortableFirefightersList';
import AssignmentsApiService from '../services/AssignmentsApiService';

const AvailableFirefighters2 = () => {
  const fetchAvailableFirefighters = (date) => {
    return AssignmentsApiService.getAvailableFirefighters(date); // Pasar la fecha al servicio
  };

  return (
    <SortableFirefightersList
      title="Lista de Requerimientos 10h"
      fetchData={fetchAvailableFirefighters} // Función corregida para manejar fecha
      listType="firefighters by order"
      orderColumn="orden10"
    />
  );
};

export default AvailableFirefighters2;
