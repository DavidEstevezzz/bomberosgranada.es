<?php

namespace App\Http\Controllers;

use App\Models\PersonalEquipment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class PersonalEquipmentController extends Controller
{
    /**
     * Mostrar listado de equipos personales
     */
    public function index()
    {
        $equipos = PersonalEquipment::all();
        return response()->json($equipos);
    }

    /**
     * Almacenar un nuevo equipo
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => ['required', Rule::in(PersonalEquipment::getCategorias())],
            'disponible' => 'boolean' 
        ]);

        $equipo = PersonalEquipment::create($request->all());

        return response()->json($equipo, 201);
    }

    /**
     * Mostrar un equipo específico
     */
    public function show(PersonalEquipment $equipo)
    {
        return response()->json($equipo);
    }

    /**
     * Actualizar un equipo específico
     */
    public function update(Request $request, PersonalEquipment $equipo)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => ['required', Rule::in(PersonalEquipment::getCategorias())],
            'disponible' => 'boolean' 
        ]);

        $equipo->update($request->all());

        return response()->json($equipo);
    }

    /**
     * Eliminar un equipo específico
     */
    public function destroy(PersonalEquipment $equipo)
    {
        $equipo->delete();

        return response()->json(null, 204);
    }
    
    /**
     * Obtener todas las categorías disponibles
     */
    public function getCategories()
    {
        return response()->json(PersonalEquipment::getCategorias());
    }

    public function toggleDisponibilidad(PersonalEquipment $equipo)
    {
        $equipo->disponible = !$equipo->disponible;
        $equipo->save();
        
        return response()->json($equipo);
    }

    public function getByPark($parkId)
    {
        $equipos = PersonalEquipment::where('parque', $parkId)->get();
        return response()->json($equipos);
    }

    /**
     * Verificar disponibilidad y asignar equipos individualmente para un puesto específico
     * 
     * @param Request $request Contiene los parámetros: 
     *                         - parkId (1: Norte, 2: Sur)
     *                         - assignment (ej: B1, C3, N2, etc)
     *                         - maxAssignment (ej: B7 si es el último bombero asignado)
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkAndAssignEquipment(Request $request)
    {
        $request->validate([
            'parkId' => 'required|integer|in:1,2',
            'assignment' => 'required|string',
            'maxAssignment' => 'required|string'
        ]);

        $parkId = $request->parkId;
        $assignment = strtoupper($request->assignment);
        $maxAssignment = strtoupper($request->maxAssignment);
        
        // Agregar logs para depuración
        Log::info("Procesando asignación: $assignment, maxAssignment: $maxAssignment, parque: $parkId");
        
        // Determinar el rol basado en la primera letra de la asignación
        $role = substr($assignment, 0, 1);
        
        // Si es operador, devolver respuesta vacía porque no necesitan equipos
        if ($role == 'O' || strpos($assignment, 'OPERADOR') !== false) {
            Log::info("Asignación de Operador detectada, no se asignan equipos");
            return response()->json([
                'assignment' => $assignment,
                'initial_number' => 0,
                'equipment_assigned' => [],
                'equipment_details' => [],
                'unavailable_equipment' => [],
                'nonexistent_equipment' => []
            ]);
        }
        
        // Determinar las categorías a verificar según el rol
        $categoriasAVerificar = $this->getCategoriasForRole($role);
        Log::info("Rol: $role, Categorías a verificar: " . implode(", ", $categoriasAVerificar));
        
        // Obtener el número estático inicial basado en el rol, número y parque
        $numeroInicial = $this->getInitialEquipmentNumber($role, substr($assignment, 1), $parkId);
        Log::info("Número inicial asignado: $numeroInicial");
        
        // Calcular el siguiente número disponible para asignaciones adicionales
        // basado en el maxAssignment (último bombero asignado)
        $siguienteNumeroDisponible = $this->getNextAvailableBaseNumber($maxAssignment, $parkId);
        Log::info("Siguiente número disponible base: $siguienteNumeroDisponible");
        
        // Registrar los números ya utilizados globalmente para evitar repeticiones
        // Usamos una variable estática para mantener el estado durante la ejecución
        static $numerosUtilizadosGlobal = [];
        
        // Inicializamos por primera vez si es necesario
        if (!isset($numerosUtilizadosGlobal[$parkId])) {
            $numerosUtilizadosGlobal[$parkId] = [];
        }
        
        // Asegurarse de que exista un seguimiento por categoría
        foreach ($categoriasAVerificar as $categoria) {
            if (!isset($numerosUtilizadosGlobal[$parkId][$categoria])) {
                $numerosUtilizadosGlobal[$parkId][$categoria] = [];
            }
        }
        
        // Asignar equipos individualmente
        $equipoAsignado = [];
        $equiposNoDisponibles = [];
        $equiposNoExistentes = [];
        
        foreach ($categoriasAVerificar as $categoria) {
            // Comprobar primero si el equipo con el número inicial existe
            $equipoExiste = $this->checkEquipmentExists($categoria, $numeroInicial);
            
            if (!$equipoExiste) {
                Log::info("Equipo $categoria $numeroInicial no existe");
                $equiposNoExistentes[] = "$categoria $numeroInicial";
                
                // Buscar un equipo alternativo que exista y esté disponible
                $numeroAlternativo = $this->findAvailableEquipment(
                    $categoria, 
                    $siguienteNumeroDisponible, 
                    $role, 
                    $parkId, 
                    $numerosUtilizadosGlobal[$parkId][$categoria]
                );
                
                if ($numeroAlternativo !== null) {
                    $equipoAsignado[$categoria] = $numeroAlternativo;
                    $numerosUtilizadosGlobal[$parkId][$categoria][] = $numeroAlternativo;
                    Log::info("Asignado número alternativo para $categoria: $numeroAlternativo (no existía el inicial)");
                } else {
                    Log::warning("No se encontró número alternativo para $categoria");
                }
                
                continue;
            }
            
            // Verificar si el número ya ha sido utilizado para esta categoría
            if (in_array($numeroInicial, $numerosUtilizadosGlobal[$parkId][$categoria])) {
                Log::info("Equipo $categoria $numeroInicial ya asignado a otro, buscando alternativa");
                $equiposNoDisponibles[] = "$categoria $numeroInicial (ya asignado)";
                
                // Buscar un equipo alternativo
                $numeroAlternativo = $this->findAvailableEquipment(
                    $categoria, 
                    $siguienteNumeroDisponible, 
                    $role, 
                    $parkId, 
                    $numerosUtilizadosGlobal[$parkId][$categoria]
                );
                
                if ($numeroAlternativo !== null) {
                    $equipoAsignado[$categoria] = $numeroAlternativo;
                    $numerosUtilizadosGlobal[$parkId][$categoria][] = $numeroAlternativo;
                    Log::info("Asignado número alternativo para $categoria: $numeroAlternativo (el inicial ya estaba asignado)");
                } else {
                    Log::warning("No se encontró número alternativo para $categoria después de verificar uso previo");
                }
                
                continue;
            }
            
            // Comprobar si el equipo está disponible
            $disponible = $this->isEquipmentAvailable($categoria, $numeroInicial);
            
            if ($disponible) {
                $equipoAsignado[$categoria] = $numeroInicial;
                $numerosUtilizadosGlobal[$parkId][$categoria][] = $numeroInicial;
                Log::info("Asignado número inicial para $categoria: $numeroInicial");
            } else {
                Log::info("Equipo $categoria $numeroInicial no disponible, buscando alternativa");
                $equiposNoDisponibles[] = "$categoria $numeroInicial";
                
                // Si no está disponible, buscar el siguiente disponible evitando números ya utilizados
                $numeroAlternativo = $this->findAvailableEquipment(
                    $categoria, 
                    $siguienteNumeroDisponible, 
                    $role, 
                    $parkId, 
                    $numerosUtilizadosGlobal[$parkId][$categoria]
                );
                
                if ($numeroAlternativo !== null) {
                    $equipoAsignado[$categoria] = $numeroAlternativo;
                    $numerosUtilizadosGlobal[$parkId][$categoria][] = $numeroAlternativo;
                    Log::info("Asignado número alternativo para $categoria: $numeroAlternativo");
                } else {
                    Log::warning("No se encontró número alternativo para $categoria");
                }
            }
        }
        
        // Generar nombres completos de equipos para facilitar la visualización
        $equiposCompletos = [];
        foreach ($equipoAsignado as $categoria => $numero) {
            $equiposCompletos[] = [
                'categoria' => $categoria,
                'numero' => $numero,
                'nombre_completo' => "$categoria $numero" 
            ];
        }
        
        $response = [
            'assignment' => $assignment,
            'initial_number' => $numeroInicial,
            'equipment_assigned' => $equipoAsignado,
            'equipment_details' => $equiposCompletos,
            'unavailable_equipment' => $equiposNoDisponibles,
            'nonexistent_equipment' => $equiposNoExistentes
        ];
        
        Log::info("Respuesta final para $assignment: " . json_encode($response));
        
        return response()->json($response);
    }
    
    /**
     * Comprobar si un equipo existe en la base de datos
     */
    private function checkEquipmentExists($categoria, $numero)
    {
        $equipo = PersonalEquipment::where('nombre', "$categoria $numero")->exists();
        return $equipo;
    }
    
    /**
     * Obtener las categorías de equipo según el rol
     */
    private function getCategoriasForRole($role)
    {
        switch ($role) {
            case 'N':
            case 'S':
            case 'J':
                // Mandos (N, S, Jefe de Guardia)
                return [
                    'Portátil',
                    'Micro',
                    'PTT',
                    'Linterna casco',
                    'Linterna pecho'
                ];
            case 'C':
                // Conductores
                return [
                    'Portátil',
                    'Micro',
                    'Linterna casco',
                    'Linterna pecho'
                ];
            case 'B':
            default:
                // Bomberos
                return [
                    'Portátil',
                    'PTT',
                    'Linterna casco',
                    'Linterna pecho'
                ];
        }
    }
    
    /**
     * Obtener el número de equipo inicial basado en el rol, número y parque
     */
    private function getInitialEquipmentNumber($role, $number, $parkId)
    {
        $numberInt = (int)$number;
        $result = 0;
        
        switch ($role) {
            case 'N':
                // Parque Norte - Mandos N
                if ($numberInt == 1) $result = 1;
                elseif ($numberInt == 2) $result = 3;
                elseif ($numberInt >= 3) $result = 5 + (($numberInt - 3) * 2);
                break;
                
            case 'S':
                // Parque Sur - Mandos S
                if ($numberInt == 1) $result = 2;
                elseif ($numberInt == 2) $result = 4;
                elseif ($numberInt >= 3) $result = 6 + (($numberInt - 3) * 2);
                break;
                
            case 'C':
                // Conductores
                if ($parkId == 1) { // Norte
                    $result = 7 + (($numberInt - 1) * 2);
                } else { // Sur
                    $result = 8 + (($numberInt - 1) * 2);
                }
                break;
                
            case 'B':
                // Bomberos
                if ($parkId == 1) { // Norte
                    $result = 15 + (($numberInt - 1) * 2);
                } else { // Sur
                    $result = 16 + (($numberInt - 1) * 2);
                }
                break;
                
            case 'J':
                // Jefe de Guardia
                $result = 1;
                break;
        }
        
        Log::info("Calculado número inicial para $role$number en parque $parkId: $result");
        return $result;
    }
    
    /**
     * Obtener el siguiente número base disponible después del último bombero asignado
     */
    private function getNextAvailableBaseNumber($maxAssignment, $parkId)
    {
        $role = substr($maxAssignment, 0, 1);
        $number = (int)substr($maxAssignment, 1);
        $result = 50; // Valor por defecto alto
        
        // Calcular el próximo número después del último asignado
        if ($role == 'B') {
            $number++; // Siguiente bombero
            if ($parkId == 1) { // Norte
                $result = 15 + (($number - 1) * 2);
            } else { // Sur
                $result = 16 + (($number - 1) * 2);
            }
        } elseif ($role == 'C') {
            $number++; // Siguiente conductor
            if ($parkId == 1) { // Norte
                $result = 7 + (($number - 1) * 2);
            } else { // Sur
                $result = 8 + (($number - 1) * 2);
            }
        } elseif ($role == 'N') {
            $number++;
            if ($number == 2) $result = 3;
            else if ($number >= 3) $result = 5 + (($number - 3) * 2);
        } elseif ($role == 'S') {
            $number++;
            if ($number == 2) $result = 4;
            else if ($number >= 3) $result = 6 + (($number - 3) * 2);
        }
        
        Log::info("Calculado siguiente número base para $maxAssignment en parque $parkId: $result");
        return $result;
    }
    
    /**
     * Verificar si un equipo específico está disponible
     */
    private function isEquipmentAvailable($categoria, $numero)
    {
        $equipo = PersonalEquipment::where('nombre', "$categoria $numero")
                                   ->first();
        
        // Si el equipo no existe o está disponible
        $disponible = !$equipo || $equipo->disponible;
        Log::info("Verificando disponibilidad de $categoria $numero: " . ($disponible ? "Disponible" : "No disponible"));
        return $disponible;
    }
    
    /**
     * Encontrar un equipo que exista y esté disponible
     * Considera los números ya utilizados para evitar repeticiones
     */
    private function findAvailableEquipment($categoria, $numeroInicio, $role, $parkId, $numerosUtilizados)
    {
        // Establecer límites para los roles específicos
        $minNumber = 1;
        $maxNumber = 100; // Límite alto por defecto
        
        // Establecer límites para conductores
        if ($role == 'C') {
            $minNumber = ($parkId == 1) ? 7 : 8; // Norte/Sur
            $maxNumber = ($parkId == 1) ? 15 : 16; // Norte/Sur
        }
        
        $currentNumber = $numeroInicio;
        Log::info("Buscando equipo disponible para $categoria, inicio en $currentNumber");
        
        // Si es conductor y el número inicial está fuera del rango, ajustarlo
        if ($role == 'C' && ($currentNumber < $minNumber || $currentNumber > $maxNumber)) {
            $currentNumber = $minNumber;
            Log::info("Ajustando número para conductor a $currentNumber (min: $minNumber, max: $maxNumber)");
        }
        
        // Limite para evitar bucles infinitos
        $maxIterations = 50;
        $iterations = 0;
        
        // Conjunto para registrar números ya comprobados
        $checkedNumbers = [];
        
        while ($iterations < $maxIterations) {
            // Marcar este número como comprobado
            $checkedNumbers[] = $currentNumber;
            
            // Si es conductor, mantener dentro del rango permitido
            if ($role == 'C') {
                if ($currentNumber > $maxNumber) {
                    $currentNumber = $minNumber; // Volver al inicio del rango
                    Log::info("Conductor: volviendo al inicio del rango: $currentNumber");
                }
            }
            
            // Verificar si este número ya ha sido utilizado por esta categoría
            if (in_array($currentNumber, $numerosUtilizados)) {
                Log::info("Saltando número $currentNumber porque ya está asignado a otro en la misma categoría");
                $currentNumber += 2;
                $iterations++;
                continue;
            }
            
            // Verificar si el equipo existe
            $existe = $this->checkEquipmentExists($categoria, $currentNumber);
            
            if (!$existe) {
                Log::info("Equipo $categoria $currentNumber no existe, probando siguiente");
                $currentNumber += 2;
                $iterations++;
                continue;
            }
            
            // Verificar si está disponible
            if ($this->isEquipmentAvailable($categoria, $currentNumber)) {
                Log::info("Encontrado equipo disponible: $categoria $currentNumber");
                return $currentNumber;
            }
            
            // Para mantener la paridad (par/impar) según el parque
            $currentNumber += 2;
            $iterations++;
        }
        
        Log::warning("No se encontró equipo disponible para $categoria después de $iterations iteraciones. Números comprobados: " . implode(", ", $checkedNumbers));
        return null; // No se encontró equipo disponible después de máximas iteraciones
    }
    
    /**
     * Método original para verificar disponibilidad (mantenido por compatibilidad)
     */
    public function checkAvailability($equipmentNumber)
    {
        // Lista de categorías de equipos a verificar
        $categoriasAVerificar = [
            'Portátil', 
            'PTT', 
            'Linterna casco', 
            'Linterna pecho'
        ];

        // Verificar cada categoría de equipo con el número proporcionado
        $disponible = true;
        $equiposNoDisponibles = [];

        foreach ($categoriasAVerificar as $categoria) {
            $nombreEquipo = "$categoria $equipmentNumber";
            $equipo = PersonalEquipment::where('nombre', 'LIKE', $nombreEquipo)
                                       ->first();
            
            // Si el equipo existe pero no está disponible
            if ($equipo && !$equipo->disponible) {
                $disponible = false;
                $equiposNoDisponibles[] = $nombreEquipo;
            }
        }

        return response()->json([
            'available' => $disponible,
            'equipment_number' => $equipmentNumber,
            'unavailable_equipment' => $equiposNoDisponibles
        ]);
    }
}