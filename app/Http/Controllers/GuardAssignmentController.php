<?php

namespace App\Http\Controllers;

use App\Models\GuardAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GuardAssignmentController extends Controller
{
    /**
     * Muestra todas las asignaciones de guardia.
     */
    public function index()
    {
        $assignments = GuardAssignment::all();
        return response()->json($assignments);
    }

    /**
     * Crea una nueva asignación de guardia.
     */
    public function store(Request $request)
    {
        $rules = [
            'id_guard'    => 'required|exists:guards,id',
            'id_empleado' => 'required|exists:users,id_empleado',
            'turno'       => 'required|in:Mañana,Tarde,Noche',
            'asignacion'  => 'required|string|max:10'
        ];

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $assignment = GuardAssignment::create($request->all());
        return response()->json($assignment, 201);
    }

    /**
     * Muestra una asignación específica.
     */
    public function show($id)
    {
        $assignment = GuardAssignment::find($id);
        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found'], 404);
        }
        return response()->json($assignment);
    }

    /**
     * Actualiza una asignación existente.
     */
    public function update(Request $request, $id)
    {
        $rules = [
            'id_guard'    => 'sometimes|required|exists:guards,id',
            'id_empleado' => 'sometimes|required|exists:users,id_empleado',
            'turno'       => 'sometimes|required|in:Mañana,Tarde,Noche',
            'asignacion'  => 'sometimes|required|string|max:10'
        ];

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $assignment = GuardAssignment::find($id);
        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found'], 404);
        }

        $assignment->update($request->all());
        return response()->json([
            'message' => 'Assignment updated successfully',
            'assignment' => $assignment
        ], 200);
    }

    /**
     * Elimina una asignación.
     */
    public function destroy($id)
    {
        $assignment = GuardAssignment::find($id);
        if (!$assignment) {
            return response()->json(['message' => 'Assignment not found'], 404);
        }
        $assignment->delete();
        return response()->json(['message' => 'Assignment deleted successfully'], 200);
    }

    /**
     * Actualiza o crea una asignación (si no existe) para un bombero en un turno determinado.
     */
    public function updateOrCreateAssignment(Request $request)
    {
        $rules = [
            'id_guard'    => 'required|exists:guards,id',
            'id_empleado' => 'required|exists:users,id_empleado',
            'turno'       => 'required|in:Mañana,Tarde,Noche',
            'asignacion'  => 'required|string|max:15'
        ];

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $assignment = GuardAssignment::updateOrCreate(
            [
                'id_guard'    => $request->id_guard,
                'id_empleado' => $request->id_empleado,
                'turno'       => $request->turno,
            ],
            [
                'asignacion'  => $request->asignacion,
            ]
        );

        return response()->json([
            'message' => 'Assignment updated or created successfully',
            'assignment' => $assignment
        ], 200);
    }
}
