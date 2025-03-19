import React from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import IncrementableFirefightersList from '../components/IncrementableFirefightersList';

const TransferList = () => {
  const fetchAvailableFirefighters = (date) => {
    return AssignmentsApiService.getWorkingFirefighters(date); // Pasar la fecha al servicio
  };

  return (
    <IncrementableFirefightersList
      title="Lista de Traslados entre parques"
      fetchData={fetchAvailableFirefighters} // Función corregida para manejar fecha
      listType="firefighters by order"
      orderColumn="traslados"
      orderColumn2="fecha_traslado"
    />
  );
};

export default TransferList;
