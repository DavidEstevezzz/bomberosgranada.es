<?php

namespace App\Http\Controllers;

use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;


class IncidentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $incident = Incident::all();

        return response()->json($incident);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $rules = [
            'id_incidencia' => 'required',
            'id_empleado' => 'required',
            'estado' => 'required',
            'parque' => 'required',
            'descripcion' => 'required',
            'fecha' => 'required',
        ];

        $validator = Validator::make($request->input(), $rules);

        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $incident = Incident::create($request->all());
        $incident->save();
        return response()->json($incident, 201);
    
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $id = Incident::find($id);

        return response()->json($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Incident $incident)
    {
        $rules = [
            'id_incidencia' => 'required',
            'id_empleado' => 'required',
            'estado' => 'required',
            'parque' => 'required',
            'descripcion' => 'required',
            'fecha' => 'required',
        ];

        $validator = Validator::make($request->input(), $rules);

        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $incident->update($request->all());
        return response()->json($incident, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Incident $id)
    {
        $id->delete();
        return response()->json(null, 204);
    }
}
