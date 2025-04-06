<?php

namespace App\Http\Controllers;

use App\Models\PersonalEquipment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
        
        // Determinar el rol basado en la primera letra de la asignación
        $role = substr($assignment, 0, 1);
        
        // Determinar las categorías a verificar según el rol
        $categoriasAVerificar = $this->getCategoriasForRole($role);
        
        // Obtener el número estático inicial basado en el rol, número y parque
        $numeroInicial = $this->getInitialEquipmentNumber($role, substr($assignment, 1), $parkId);
        
        // Calcular el siguiente número disponible para asignaciones adicionales
        // basado en el maxAssignment (último bombero asignado)
        $siguienteNumeroDisponible = $this->getNextAvailableBaseNumber($maxAssignment, $parkId);
        
        // Asignar equipos individualmente
        $equipoAsignado = [];
        $equiposNoDisponibles = [];
        
        foreach ($categoriasAVerificar as $categoria) {
            // Comprobar si el equipo con el número inicial está disponible
            $disponible = $this->isEquipmentAvailable($categoria, $numeroInicial);
            
            if ($disponible) {
                $equipoAsignado[$categoria] = $numeroInicial;
            } else {
                // Si no está disponible, buscar el siguiente disponible
                $numeroAlternativo = $this->findNextAvailableEquipment($categoria, $siguienteNumeroDisponible, $role, $parkId);
                
                if ($numeroAlternativo !== null) {
                    $equipoAsignado[$categoria] = $numeroAlternativo;
                } else {
                    $equiposNoDisponibles[] = "$categoria $numeroInicial";
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
        
        return response()->json([
            'assignment' => $assignment,
            'initial_number' => $numeroInicial,
            'equipment_assigned' => $equipoAsignado,
            'equipment_details' => $equiposCompletos,
            'unavailable_equipment' => $equiposNoDisponibles
        ]);
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
                    'Micro-altavoz',
                    'PTT',
                    'Linterna casco',
                    'Linterna pecho'
                ];
            case 'C':
                // Conductores
                return [
                    'Portátil',
                    'Micro-altavoz',
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
        
        switch ($role) {
            case 'N':
                // Parque Norte - Mandos N
                if ($numberInt == 1) return 1;
                if ($numberInt == 2) return 3;
                if ($numberInt >= 3) return 5 + (($numberInt - 3) * 2);
                break;
                
            case 'S':
                // Parque Sur - Mandos S
                if ($numberInt == 1) return 2;
                if ($numberInt == 2) return 4;
                if ($numberInt >= 3) return 6 + (($numberInt - 3) * 2);
                break;
                
            case 'C':
                // Conductores
                if ($parkId == 1) { // Norte
                    return 7 + (($numberInt - 1) * 2);
                } else { // Sur
                    return 8 + (($numberInt - 1) * 2);
                }
                break;
                
            case 'B':
                // Bomberos
                if ($parkId == 1) { // Norte
                    return 15 + (($numberInt - 1) * 2);
                } else { // Sur
                    return 16 + (($numberInt - 1) * 2);
                }
                break;
                
            case 'J':
                // Jefe de Guardia
                return 1;
                
            default:
                return 0;
        }
        
        return 0;
    }
    
    /**
     * Obtener el siguiente número base disponible después del último bombero asignado
     */
    private function getNextAvailableBaseNumber($maxAssignment, $parkId)
    {
        $role = substr($maxAssignment, 0, 1);
        $number = (int)substr($maxAssignment, 1);
        
        // Calcular el próximo número después del último asignado
        if ($role == 'B') {
            $number++; // Siguiente bombero
            if ($parkId == 1) { // Norte
                return 15 + (($number - 1) * 2);
            } else { // Sur
                return 16 + (($number - 1) * 2);
            }
        } elseif ($role == 'C') {
            $number++; // Siguiente conductor
            if ($parkId == 1) { // Norte
                return 7 + (($number - 1) * 2);
            } else { // Sur
                return 8 + (($number - 1) * 2);
            }
        } elseif ($role == 'N') {
            $number++;
            if ($number == 2) return 3;
            if ($number >= 3) return 5 + (($number - 3) * 2);
        } elseif ($role == 'S') {
            $number++;
            if ($number == 2) return 4;
            if ($number >= 3) return 6 + (($number - 3) * 2);
        }
        
        // Si no es un rol reconocido, empezar en un número alto
        return 50;
    }
    
    /**
     * Verificar si un equipo específico está disponible
     */
    private function isEquipmentAvailable($categoria, $numero)
    {
        $equipo = PersonalEquipment::where('nombre', "$categoria $numero")
                                   ->first();
        
        // Si el equipo no existe o está disponible
        return !$equipo || $equipo->disponible;
    }
    
    /**
     * Encontrar el siguiente equipo disponible de una categoría específica
     */
    private function findNextAvailableEquipment($categoria, $numeroInicio, $role, $parkId)
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
        
        // Si es conductor y el número inicial está fuera del rango, ajustarlo
        if ($role == 'C' && ($currentNumber < $minNumber || $currentNumber > $maxNumber)) {
            $currentNumber = $minNumber;
        }
        
        // Limite para evitar bucles infinitos
        $maxIterations = 50;
        $iterations = 0;
        
        while ($iterations < $maxIterations) {
            // Si es conductor, mantener dentro del rango permitido
            if ($role == 'C') {
                if ($currentNumber > $maxNumber) {
                    $currentNumber = $minNumber; // Volver al inicio del rango
                }
            }
            
            if ($this->isEquipmentAvailable($categoria, $currentNumber)) {
                return $currentNumber;
            }
            
            // Para mantener la paridad (par/impar) según el parque
            $currentNumber += 2;
            $iterations++;
        }
        
        return null; // No se encontró equipo disponible después de 50 intentos
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