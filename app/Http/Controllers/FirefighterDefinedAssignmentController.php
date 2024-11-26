<?php

namespace App\Http\Controllers;

use App\Models\Firefighters_defined_assignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class FirefighterDefinedAssignmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $firefighter_defined_assignments = Firefighters_defined_assignment::with([
            'firefighter:id_empleado,nombre,apellido',
            'brigadeOrigin:id_brigada,nombre',
            'brigadeDestination:id_brigada,nombre'
        ])->get();
        return response()->json($firefighter_defined_assignments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $rules = [
            'id_asignacion' => 'unique:firefighters_defined_assignments,id_asignacion',
            'fecha_ini' => 'required|date',
            'fecha_vuelta' => 'required|date|after_or_equal:fecha_ini',
            'id_empleado' => 'required|exists:users,id_empleado',
            'id_brigada_origen' => 'nullable|exists:brigades,id_brigada',
            'id_brigada_destino' => 'required|exists:brigades,id_brigada',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $firefighter_defined_assignment = Firefighters_defined_assignment::create($request->all());
        return response()->json($firefighter_defined_assignment, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id_asignacion)
    {
        $firefighter_defined_assignment = Firefighters_defined_assignment::where('id_asignacion', $id_asignacion)->first();

        if (!$firefighter_defined_assignment) {
            return response()->json(['message' => 'Firefighter defined assignment not found'], 404);
        }

        return response()->json($firefighter_defined_assignment);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id_asignacion)
    {
        $rules = [
            'id_asignacion' => 'unique:firefighters_defined_assignments,id_asignacion,' . $id_asignacion . ',id_asignacion',
            'fecha_ini' => 'required|date',
            'fecha_vuelta' => 'required|date|after_or_equal:fecha_ini',
            'id_empleado' => 'required|exists:users,id_empleado',
            'id_brigada_origen' => 'nullable|exists:brigades,id_brigada',
            'id_brigada_destino' => 'required|exists:brigades,id_brigada',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $firefighter_defined_assignment = Firefighters_defined_assignment::where('id_asignacion', $id_asignacion)->first();

        if (!$firefighter_defined_assignment) {
            return response()->json(['message' => 'Firefighter defined assignment not found'], 404);
        }

        $firefighter_defined_assignment->update($request->all());
        return response()->json($firefighter_defined_assignment, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id_asignacion)
    {
        $firefighter_defined_assignment = Firefighters_defined_assignment::where('id_asignacion', $id_asignacion)->first();

        if (!$firefighter_defined_assignment) {
            return response()->json(['message' => 'Firefighter defined assignment not found'], 404);
        }

        $firefighter_defined_assignment->delete();
        return response()->json(null, 204);
    }

    /**
     * Revert assignments that have reached their return date.
     */
    public function revertAssignments()
    {
        $assignments = Firefighters_defined_assignment::all();
        foreach ($assignments as $assignment) {
            $assignment->checkAndRevertAssignment();
        }

        return response()->json(['message' => 'Assignments reverted successfully']);
    }
}
