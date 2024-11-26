<?php

namespace App\Http\Controllers;
use App\Models\Commands_assignment;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class Commands_assignmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $commands_assignment = Commands_assignment::all();

        return response()->json($commands_assignment);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $rules =  [
            'id_asignacion' => 'required',
            'fecha_ini' => 'required',
            'id_empleado' => 'required',
            'id_brigada_origen' => 'required',
            'id_brigada_destino' => 'required',
        ];
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $id = Commands_assignment::find($id);

        return response()->json($id);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Commands_assignment $id)
    {
        $rules =  [
            'id_asignacion' => 'required',
            'fecha_ini' => 'required',
            'id_empleado' => 'required',
            'id_brigada_origen' => 'required',
            'id_brigada_destino' => 'required',
        ];

        $validator = Validator::make($request->input(), $rules);

        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $id->update($request->all());
        return response()->json($id, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Commands_assignment $id)
    {
        $id->delete();
        return response()->json(null, 204);
    }
}
