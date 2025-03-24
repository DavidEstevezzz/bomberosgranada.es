import React from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import IncrementableFirefightersList from '../components/IncrementableFirefightersList';

const TransferList = () => {
  const fetchAvailableFirefighters = (date) => {
    return AssignmentsApiService.getWorkingFirefighters(date); // Pasar la fecha al servicio
  };

  return (
    <IncrementableFirefightersList
      title="Lista de Limpieza"
      fetchData={fetchAvailableFirefighters} // Función corregida para manejar fecha
      listType="firefighters by order"
      orderColumn="basura"
      orderColumn2="fecha_basura"
    />
  );
};

export default TransferList;
