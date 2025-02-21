<?php

namespace App\Http\Controllers;

use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class IncidentController extends Controller
{
    /**
     * Muestra todas las incidencias.
     */
    public function index()
    {
        $incidents = Incident::with(['creator', 'employee2', 'vehicle', 'park', 'resolver'])->get();
        return response()->json($incidents);
    }

    /**
     * Almacena una nueva incidencia.
     */
    public function store(Request $request)
    {
        // Reglas básicas
        $rules = [
            'id_empleado'   => 'required',
            'tipo'          => 'required|in:vehiculo,personal,instalacion',
            'estado'        => 'required',
            'id_parque'     => 'required',
            'fecha'         => 'required|date',
            'descripcion'   => 'required|string',
            'leido'         => 'required|boolean',
            // 'resulta_por' es opcional
        ];

        // Reglas condicionales según el tipo
        $tipo = $request->input('tipo');
        if ($tipo === 'vehiculo') {
            $rules['matricula'] = 'required';
        } elseif ($tipo === 'personal') {
            $rules['id_empleado2'] = 'required';
        }
        
        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $incident = Incident::create($request->all());
        return response()->json($incident, 201);
    }

    /**
     * Muestra una incidencia específica.
     */
    public function show($id)
    {
        $incident = Incident::find($id);
        if (!$incident) {
            return response()->json(['error' => 'Incidencia no encontrada'], 404);
        }
        return response()->json($incident);
    }

    /**
     * Actualiza una incidencia existente.
     */
    public function update(Request $request, $id)
    {
        $incident = Incident::find($id);
        if (!$incident) {
            return response()->json(['error' => 'Incidencia no encontrada'], 404);
        }

        $rules = [
            'id_empleado'   => 'required',
            'tipo'          => 'required|in:vehiculo,personal,instalacion',
            'estado'        => 'required',
            'id_parque'     => 'required',
            'fecha'         => 'required|date',
            'descripcion'   => 'required|string',
            'leido'         => 'required|boolean',
            // 'resulta_por' es opcional
        ];

        $tipo = $request->input('tipo');
        if ($tipo === 'vehiculo') {
            $rules['matricula'] = 'required';
        } elseif ($tipo === 'personal') {
            $rules['id_empleado2'] = 'required';
        }

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $incident->update($request->all());
        return response()->json($incident, 200);
    }

    /**
     * Elimina una incidencia.
     */
    public function destroy($id)
    {
        $incident = Incident::find($id);
        if (!$incident) {
            return response()->json(['error' => 'Incidencia no encontrada'], 404);
        }
        $incident->delete();
        return response()->json(null, 204);
    }

    /**
 * Marca una incidencia como leída.
 */
public function markAsRead($id)
{
    $incident = Incident::find($id);
    if (!$incident) {
        return response()->json(['error' => 'Incidencia no encontrada'], 404);
    }
    $incident->leido = true;
    $incident->save();
    return response()->json($incident, 200);
}


public function resolve(Request $request, $id)
{
    $incident = Incident::find($id);
    if (!$incident) {
        return response()->json(['error' => 'Incidencia no encontrada'], 404);
    }

    // Validar que se proporcione el id del empleado que resuelve la incidencia
    $validator = Validator::make($request->all(), [
         'resulta_por' => 'required'
    ]);
    if ($validator->fails()){
         return response()->json($validator->errors(), 400);
    }

    $incident->estado = 'resuelta';
    $incident->resulta_por = $request->input('resulta_por');
    $incident->save();

    return response()->json($incident, 200);
}

public function countPending()
{
    $pendingCount = Incident::where('estado', 'pendiente')->count();
    return response()->json(['pending' => $pendingCount], 200);
}

}
