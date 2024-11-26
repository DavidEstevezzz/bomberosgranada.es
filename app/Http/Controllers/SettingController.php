<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        return response()->json(Setting::all());
    }

    public function show($id)
    {
        return response()->json(Setting::findOrFail($id));
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|unique:settings|max:255',
            'valor' => 'required|max:255',
            'descripcion' => 'nullable',
        ]);

        $setting = Setting::create($request->all());
        return response()->json($setting, 201);
    }

    public function update(Request $request, $id)
    {
        $setting = Setting::findOrFail($id);

        $request->validate([
            'nombre' => 'required|max:255|unique:settings,nombre,' . $setting->id,
            'valor' => 'required|max:255',
            'descripcion' => 'nullable',
        ]);

        $setting->update($request->all());
        return response()->json($setting, 200);
    }

    public function destroy($id)
    {
        $setting = Setting::findOrFail($id);
        $setting->delete();
        return response()->json(null, 204);
    }
}
