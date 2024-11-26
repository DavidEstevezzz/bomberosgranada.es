<?php

namespace App\Http\Controllers;
use App\Models\Date;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class DateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $date = Date::all();

        return response()->json($date);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $rules = [
            'fecha' => 'required',
            'tipo' => 'required',
        ];

        $validator = Validator::make($request->input(), $rules);

        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $date = Date::create($request->all());
        $date->save();
        return response()->json($date, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $id = Date::find($id);
        return response()->json($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Date $date)
    {
        $rules = [
            'fecha' => 'required',
            'tipo' => 'required',
        ];

        $validator = Validator::make($request->input(), $rules);

        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $date->update($request->all());
        return response()->json($date, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Date $date)
    {
        $date->delete();
        return response()->json(null, 204);
    }
}
