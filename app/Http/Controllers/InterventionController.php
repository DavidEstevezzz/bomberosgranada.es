<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Intervention;
use Illuminate\Support\Facades\Validator;

class InterventionController extends Controller
{
    // Listar todas las intervenciones
    public function index()
    {
        $intervenciones = Intervention::all();
        return response()->json($intervenciones, 200);
    }

    // Mostrar una intervención por 'parte' (clave primaria)
    public function show($parte)
    {
        $intervencion = Intervention::find($parte);
        if (!$intervencion) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        }
        return response()->json($intervencion, 200);
    }

    // Crear una nueva intervención
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_guard' => 'required|exists:guards,id',
            'parte'    => 'required|string',
            'tipo'     => 'required|string',
            'mando'    => 'required|exists:users,id_empleado'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $intervencion = Intervention::create($request->all());
        return response()->json($intervencion, 201);
    }

    // Actualizar una intervención existente (identificada por 'parte')
    public function update(Request $request, $parte)
    {
        $intervencion = Intervention::find($parte);
        if (!$intervencion) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            // No se actualiza la clave primaria 'parte'
            'id_guard' => 'sometimes|required|exists:guards,id',
            'tipo'     => 'sometimes|required|string',
            'mando'    => 'sometimes|required|exists:users,id_empleado'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $intervencion->update($request->all());
        return response()->json($intervencion, 200);
    }

    // Eliminar una intervención por 'parte'
    public function destroy($parte)
    {
        $intervencion = Intervention::find($parte);
        if (!$intervencion) {
            return response()->json(['message' => 'Registro no encontrado'], 404);
        }
        $intervencion->delete();
        return response()->json(null, 204);
    }

    public function getInterventionsByGuard($id_guard)
{
    $interventions = Intervention::where('id_guard', $id_guard)->get();
    return response()->json($interventions, 200);
}
}
