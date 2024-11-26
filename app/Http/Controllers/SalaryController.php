<?php

namespace App\Http\Controllers;

use App\Models\Salary;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class SalaryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $salaries = Salary::all();

        return response()->json($salaries);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $rules = [
            'tipo' => 'required',
            'fecha_ini' => 'required|date',
            'precio_diurno' => 'required|numeric',
            'precio_nocturno' => 'required|numeric',
            'horas_diurnas' => 'required|integer',
            'horas_nocturnas' => 'required|integer',
        ];
        
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $salary = Salary::create($request->all());
        return response()->json($salary, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id_salario)
    {
        $salary = Salary::findOrFail($id_salario);

        return response()->json($salary);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id_salario)
    {
        $rules = [
            'tipo' => 'required',
            'fecha_ini' => 'required|date',
            'precio_diurno' => 'required|numeric',
            'precio_nocturno' => 'required|numeric',
            'horas_diurnas' => 'required|integer',
            'horas_nocturnas' => 'required|integer',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $salary = Salary::findOrFail($id_salario);
        $salary->update($request->all());
        return response()->json($salary, 200);   
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id_salario)
    {
        $salary = Salary::findOrFail($id_salario);
        $salary->delete();
        return response()->json(null, 204);
    }
}
