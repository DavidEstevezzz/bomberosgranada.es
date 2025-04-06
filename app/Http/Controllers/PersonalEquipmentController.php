<?php

namespace App\Http\Controllers;

use App\Models\PersonalEquipment;
use App\Models\EquipmentAssignment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

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
     * Resetear todas las asignaciones para un parque en una fecha específica
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetEquipmentAssignments(Request $request)
    {
        $request->validate([
            'parkId' => 'required|integer|in:1,2',
            'date' => 'nullable|date'
        ]);
        
        $parkId = $request->parkId;
        $date = $request->date ?? now()->toDateString();
        
        $count = $this->markAllAssignmentsAsInactive($parkId, $date);
        
        Log::info("Reseteo de asignaciones para parque $parkId en fecha $date: $count asignaciones limpiadas");
        
        return response()->json([
            'success' => true,
            'message' => "Se han reseteado $count asignaciones de equipos",
            'park_id' => $parkId,
            'date' => $date
        ]);
    }

    /**
     * Marcar todas las asignaciones como inactivas para una fecha y parque específicos
     * 
     * @param int $parque ID del parque
     * @param string $fecha Fecha de las asignaciones (formato Y-m-d)
     * @return int Número de registros afectados
     */
    private function markAllAssignmentsAsInactive($parque, $fecha)
    {
        return EquipmentAssignment::where('parque', $parque)
            ->where('fecha', $fecha)
            ->update(['activo' => false]);
    }

    /**
     * Marcar un equipo como asignado
     * 
     * @param string $categoria Categoría del equipo
     * @param int $numero Número del equipo
     * @param int $parque ID del parque
     * @param string $asignacion A quién está asignado
     * @param string|null $fecha Fecha de la asignación (por defecto hoy)
     * @return EquipmentAssignment
     */
    private function markEquipmentAsAssigned($categoria, $numero, $parque, $asignacion, $fecha = null)
    {
        $fecha = $fecha ?? now()->toDateString();
        
        return EquipmentAssignment::updateOrCreate(
            ['categoria' => $categoria, 'numero' => $numero, 'parque' => $parque, 'fecha' => $fecha],
            ['asignacion' => $asignacion, 'activo' => true]
        );
    }
    
    /**
     * Verificar si un equipo ya está asignado
     * 
     * @param string $categoria Categoría del equipo
     * @param int $numero Número del equipo
     * @param int $parque ID del parque
     * @param string|null $fecha Fecha para verificar (por defecto hoy)
     * @return bool
     */
    private function isEquipmentAlreadyAssigned($categoria, $numero, $parque, $fecha = null)
    {
        $fecha = $fecha ?? now()->toDateString();
        
        return EquipmentAssignment::where('categoria', $categoria)
            ->where('numero', $numero)
            ->where('parque', $parque)
            ->where('fecha', $fecha)
            ->where('activo', true)
            ->exists();
    }

    /**
     * Verificar disponibilidad y asignar equipos individualmente para un puesto específico
     * 
     * @param Request $request Contiene los parámetros: 
     *                         - parkId (1: Norte, 2: Sur)
     *                         - assignment (ej: B1, C3, N2, etc)
     *                         - maxAssignment (ej: B7 si es el último bombero asignado)
     *                         - date (opcional, fecha para la asignación, formato: YYYY-MM-DD)
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkAndAssignEquipment(Request $request)
    {
        $request->validate([
            'parkId' => 'required|integer|in:1,2',
            'assignment' => 'required|string',
            'maxAssignment' => 'required|string',
            'date' => 'nullable|date' // Fecha opcional
        ]);

        $parkId = $request->parkId;
        $assignment = strtoupper($request->assignment);
        $maxAssignment = strtoupper($request->maxAssignment);
        $date = $request->date ?? now()->toDateString();
        
        // Agregar logs para depuración
        Log::info("Procesando asignación: $assignment, maxAssignment: $maxAssignment, parque: $parkId, fecha: $date");
        
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
        
        // Asignar equipos individualmente
        $equipoAsignado = [];
        $equiposNoDisponibles = [];
        $equiposNoExistentes = [];
        
        // Mantener un conjunto de números ya asignados para esta fecha y parque
        $numerosYaAsignados = $this->getAssignedNumbersByDate($parkId, $date);
        Log::info("Números ya asignados para esta fecha: " . implode(", ", $numerosYaAsignados));
        
        foreach ($categoriasAVerificar as $categoria) {
            Log::info("Verificando categoría: $categoria para asignación $assignment");
            
            // PASO 1: Intentar asignar primero el número que corresponde a la regla
            // Primero intentamos siempre con el número inicial según la regla
            $asignacionCompletada = false;
            
            // Comprobar si el equipo con el número inicial existe
            $equipoExiste = $this->checkEquipmentExists($categoria, $numeroInicial);
            
            if ($equipoExiste) {
                // Verificar si el número ya ha sido asignado para esta categoría en esta fecha
                $yaAsignado = $this->isEquipmentAlreadyAssigned($categoria, $numeroInicial, $parkId, $date);
                
                if (!$yaAsignado) {
                    // Comprobar si el equipo está disponible en general
                    $disponible = $this->isEquipmentAvailable($categoria, $numeroInicial);
                    
                    if ($disponible) {
                        $equipoAsignado[$categoria] = $numeroInicial;
                        
                        // Marcar este equipo como asignado en la base de datos
                        $this->markEquipmentAsAssigned(
                            $categoria, 
                            $numeroInicial, 
                            $parkId, 
                            $assignment,
                            $date
                        );
                        
                        // Añadir al conjunto de números asignados
                        $numerosYaAsignados[] = $numeroInicial;
                        
                        Log::info("Asignado número inicial para $categoria: $numeroInicial - COINCIDE CON REGLA");
                        $asignacionCompletada = true;
                    } else {
                        Log::info("Equipo $categoria $numeroInicial existe pero no está disponible");
                        $equiposNoDisponibles[] = "$categoria $numeroInicial";
                    }
                } else {
                    Log::info("Equipo $categoria $numeroInicial ya asignado a otro en esta fecha");
                    $equiposNoDisponibles[] = "$categoria $numeroInicial (ya asignado)";
                }
            } else {
                Log::info("Equipo $categoria $numeroInicial no existe en el sistema");
                $equiposNoExistentes[] = "$categoria $numeroInicial";
            }
            
            // PASO 2: Si no se pudo asignar el número inicial, buscar el próximo disponible
            if (!$asignacionCompletada) {
                Log::info("Buscando número alternativo para $categoria, partiendo de $numeroInicial");
                
                // Buscar el siguiente número disponible más cercano al inicial
                $numeroAlternativo = $this->findNextAvailableNumber(
                    $categoria,
                    $numeroInicial,
                    $parkId,
                    $date,
                    $numerosYaAsignados
                );
                
                if ($numeroAlternativo !== null) {
                    $equipoAsignado[$categoria] = $numeroAlternativo;
                    
                    // Marcar este equipo como asignado en la base de datos
                    $this->markEquipmentAsAssigned(
                        $categoria, 
                        $numeroAlternativo, 
                        $parkId, 
                        $assignment,
                        $date
                    );
                    
                    // Añadir al conjunto de números asignados
                    $numerosYaAsignados[] = $numeroAlternativo;
                    
                    Log::info("Asignado número alternativo para $categoria: $numeroAlternativo - PRÓXIMO DISPONIBLE");
                } else {
                    Log::warning("No se encontró número alternativo para $categoria");
                }
            }
        }
        
        // Generar nombres completos de equipos para facilitar la visualización
        $equiposCompletos = [];
        foreach ($equipoAsignado as $categoria => $numero) {
            // Determinar el nombre completo según la categoría
            $nombreCompleto = ($categoria === 'Micro') ? "Micro $numero" : "$categoria $numero";
            
            $equiposCompletos[] = [
                'categoria' => $categoria,
                'numero' => $numero,
                'nombre_completo' => $nombreCompleto
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
     * Obtener todos los números ya asignados para una fecha y parque
     * 
     * @param int $parque ID del parque
     * @param string $fecha Fecha de las asignaciones (formato Y-m-d)
     * @return array Lista de números ya asignados
     */
    private function getAssignedNumbersByDate($parque, $fecha)
    {
        $asignaciones = EquipmentAssignment::where('parque', $parque)
            ->where('fecha', $fecha)
            ->where('activo', true)
            ->get();
            
        // Extraer solo los números asignados
        $numeros = $asignaciones->pluck('numero')->unique()->toArray();
        
        return $numeros;
    }

    /**
     * Buscar el siguiente número disponible mayor al inicial
     * 
     * @param string $categoria Categoría del equipo
     * @param int $numeroInicial Número inicial a partir del cual buscar
     * @param int $parque ID del parque
     * @param string $fecha Fecha para la asignación
     * @param array $numerosYaAsignados Conjunto de números ya asignados
     * @return int|null Número encontrado o null si no se encuentra ninguno
     */
    private function findNextAvailableNumber($categoria, $numeroInicial, $parque, $fecha, $numerosYaAsignados)
    {
        // Definir límites según el tipo de parque (par/impar)
        $esPar = $numeroInicial % 2 === 0;
        $incremento = 2; // Siempre saltamos de 2 en 2 para mantener paridad
        
        // Límites para evitar bucles infinitos
        $maxIteraciones = 50;
        $iteraciones = 0;
        
        // Buscamos siempre en números mayores (ascendentes)
        $numero = $numeroInicial;
        
        while ($iteraciones < $maxIteraciones) {
            $numero += $incremento;
            $iteraciones++;
            
            // Comprobar si el equipo existe
            $existe = $this->checkEquipmentExists($categoria, $numero);
            if (!$existe) {
                continue;
            }
            
            // Verificar si ya está asignado para esta fecha y parque
            if (in_array($numero, $numerosYaAsignados)) {
                continue;
            }
            
            // Verificar si ya ha sido asignado específicamente para esta categoría
            $yaAsignado = $this->isEquipmentAlreadyAssigned($categoria, $numero, $parque, $fecha);
            if ($yaAsignado) {
                continue;
            }
            
            // Verificar disponibilidad general
            $disponible = $this->isEquipmentAvailable($categoria, $numero);
            if ($disponible) {
                Log::info("Encontrado número disponible ASCENDENTE: $categoria $numero");
                return $numero;
            }
        }
        
        // No se encontró ningún número disponible
        Log::warning("No se encontró ningún número disponible para $categoria en ascendente desde $numeroInicial");
        return null;
    }
    
    /**
     * Comprobar si un equipo existe en la base de datos
     */
    private function checkEquipmentExists($categoria, $numero)
    {
        // Caso especial para Micro que tienen nombre "Micro X" en la base de datos
        if ($categoria === 'Micro') {
            $equipo = PersonalEquipment::where('nombre', "Micro $numero")
                                       ->exists();
        } else {
            // Para el resto de categorías, se mantiene el formato original
            $equipo = PersonalEquipment::where('nombre', "$categoria $numero")->exists();
        }
        return $equipo;
    }
    
    /**
     * Verificar si un equipo específico está disponible
     */
    private function isEquipmentAvailable($categoria, $numero)
    {
        // Caso especial para Micro que tienen nombre "Micro X" en la base de datos
        if ($categoria === 'Micro') {
            $equipo = PersonalEquipment::where('nombre', "Micro $numero")
                                       ->first();
        } else {
            // Para el resto de categorías, se mantiene el formato original
            $equipo = PersonalEquipment::where('nombre', "$categoria $numero")
                                       ->first();
        }
        
        // Si el equipo no existe o está disponible
        $disponible = !$equipo || $equipo->disponible;
        Log::info("Verificando disponibilidad de $categoria $numero: " . ($disponible ? "Disponible" : "No disponible"));
        return $disponible;
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