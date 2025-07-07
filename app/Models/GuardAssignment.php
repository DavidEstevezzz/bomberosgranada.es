<?php

namespace App\Models;

use App\Models\Guard;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Model;

class GuardAssignment extends Model
{
    protected $fillable = [
        'id_guard', 'id_empleado', 'turno', 'asignacion'
    ];

    public function guardRecord()
    {
        return $this->belongsTo(Guard::class, 'id_guard');
    }

    public function empleado()
    {
        return $this->belongsTo(User::class, 'id_empleado');
    }

    
    public static function getAssignmentsByDateAndParque($date, $id_parque)
    {
        Log::info("=== INICIO getAssignmentsByDateAndParque ===");
        Log::info("Parámetros recibidos:");
        Log::info("- date: $date");
        Log::info("- id_parque: $id_parque");

        try {
            // PASO 1: Verificar conexión a base de datos
            Log::info("=== VERIFICANDO CONEXIÓN A BD ===");
            try {
                $connectionName = DB::getDefaultConnection();
                Log::info("Conexión activa: $connectionName");
                
                // Test simple de conexión
                $testQuery = DB::select('SELECT 1 as test');
                Log::info("✓ Conexión a BD funciona correctamente");
            } catch (\Exception $dbError) {
                Log::error("ERROR de conexión a BD: " . $dbError->getMessage());
                return null; // Esto causaría el error
            }

            // PASO 2: Verificar que existe el modelo Guard
            Log::info("=== VERIFICANDO MODELO GUARD ===");
            if (!class_exists('\App\Models\Guard')) {
                Log::error("ERROR: Clase Guard no existe");
                return null;
            }
            Log::info("✓ Clase Guard existe");

            // PASO 3: Construir la query paso a paso
            Log::info("=== CONSTRUYENDO QUERY ===");
            
            // Primero, verificar que la tabla guards existe y tiene datos
            try {
                $totalGuards = DB::table('guards')->count();
                Log::info("Total de registros en tabla guards: $totalGuards");
                
                if ($totalGuards === 0) {
                    Log::warning("La tabla guards está vacía");
                }
            } catch (\Exception $e) {
                Log::error("Error accediendo a tabla guards: " . $e->getMessage());
                return null;
            }

            // PASO 4: Buscar la guardia específica con logs detallados
            Log::info("=== BUSCANDO GUARDIA ===");
            Log::info("Query: SELECT * FROM guards WHERE date = '$date' AND id_parque = $id_parque");
            
            $guard = null;
            try {
                // Usar query builder para más control
                $guardQuery = DB::table('guards')
                                ->where('date', $date)
                                ->where('id_parque', $id_parque);
                
                Log::info("SQL generado: " . $guardQuery->toSql());
                Log::info("Bindings: " . json_encode($guardQuery->getBindings()));
                
                $guard = $guardQuery->first();
                
                if ($guard) {
                    Log::info("✓ Guardia encontrada:");
                    Log::info("  - ID: " . $guard->id);
                    Log::info("  - Fecha: " . $guard->date);
                    Log::info("  - ID Parque: " . $guard->id_parque);
                    Log::info("  - ID Brigada: " . $guard->id_brigada);
                } else {
                    Log::warning("No se encontró guardia para los criterios especificados");
                    
                    // Buscar alternativas para debug
                    Log::info("=== BÚSQUEDA DE ALTERNATIVAS PARA DEBUG ===");
                    
                    // Buscar por fecha solamente
                    $guardsByDate = DB::table('guards')->where('date', $date)->get();
                    Log::info("Guardias para la fecha $date: " . $guardsByDate->count());
                    foreach ($guardsByDate as $g) {
                        Log::info("  - ID: $g->id, Parque: $g->id_parque, Brigada: $g->id_brigada");
                    }
                    
                    // Buscar por parque solamente
                    $guardsByPark = DB::table('guards')->where('id_parque', $id_parque)->limit(5)->get();
                    Log::info("Primeras 5 guardias para el parque $id_parque:");
                    foreach ($guardsByPark as $g) {
                        Log::info("  - ID: $g->id, Fecha: $g->date, Brigada: $g->id_brigada");
                    }
                    
                    Log::warning("Devolviendo null porque no se encontró guardia");
                    return null; // AQUÍ ESTÁ EL PROBLEMA POTENCIAL
                }
                
            } catch (\Exception $e) {
                Log::error("Error ejecutando query de búsqueda de guardia:");
                Log::error("Mensaje: " . $e->getMessage());
                Log::error("Stack trace: " . $e->getTraceAsString());
                return null;
            }

            // PASO 5: Buscar asignaciones para esa guardia
            Log::info("=== BUSCANDO ASIGNACIONES ===");
            
            $guardId = $guard->id;
            Log::info("Buscando asignaciones para guard_id: $guardId");
            
            try {
                // Verificar que la tabla guard_assignments existe
                $totalAssignments = DB::table('guard_assignments')->count();
                Log::info("Total de asignaciones en la tabla: $totalAssignments");
                
                // Buscar asignaciones específicas
                $assignmentsQuery = DB::table('guard_assignments')
                                      ->where('id_guard', $guardId);
                
                Log::info("Query asignaciones: " . $assignmentsQuery->toSql());
                Log::info("Bindings: " . json_encode($assignmentsQuery->getBindings()));
                
                $assignments = $assignmentsQuery->get();
                Log::info("Asignaciones encontradas: " . $assignments->count());
                
                foreach ($assignments as $assignment) {
                    Log::info("  - ID: $assignment->id, Empleado: $assignment->id_empleado, Turno: $assignment->turno, Asignación: $assignment->asignacion");
                }
                
                // Crear la colección final
                $result = $assignments->pluck('asignacion')->unique()->values();
                Log::info("Resultado final (unique asignaciones): " . json_encode($result->toArray()));
                
                // VERIFICAR QUE EL RESULTADO SEA UNA COLECCIÓN VÁLIDA
                if (!$result instanceof \Illuminate\Support\Collection) {
                    Log::error("ERROR: El resultado NO es una Collection válida");
                    Log::error("Tipo actual: " . gettype($result));
                    return collect(); // Devolver colección vacía en lugar de null
                }
                
                Log::info("✓ Resultado es una Collection válida con " . $result->count() . " elementos");
                Log::info("=== FIN getAssignmentsByDateAndParque (ÉXITO) ===");
                
                return $result;
                
            } catch (\Exception $e) {
                Log::error("Error buscando asignaciones:");
                Log::error("Mensaje: " . $e->getMessage());
                Log::error("Stack trace: " . $e->getTraceAsString());
                return collect(); // Devolver colección vacía en lugar de null
            }

        } catch (\Exception $e) {
            Log::error("=== ERROR GENERAL en getAssignmentsByDateAndParque ===");
            Log::error("Mensaje: " . $e->getMessage());
            Log::error("Archivo: " . $e->getFile() . " línea " . $e->getLine());
            Log::error("Stack trace: " . $e->getTraceAsString());
            Log::error("=== FIN getAssignmentsByDateAndParque (ERROR) ===");
            
            return collect(); // NUNCA devolver null
        }
    }
}
