<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Suggestion;

class SuggestionController extends Controller
{
    // Listar todas las sugerencias
    public function index()
    {
        $suggestions = Suggestion::all();
        return response()->json($suggestions);
    }

    // Crear una nueva sugerencia
    public function store(Request $request)
    {
        $data = $request->validate([
            'usuario_id'   => 'required|integer|exists:users,id_empleado',
            'titulo'       => 'required|string|max:255',
            'descripcion'  => 'nullable|string',
            'estado'       => 'nullable|string|max:50',
            'conteo_votos' => 'nullable|integer'
        ]);

        // Asignamos valor por defecto si no se envía
        if (!isset($data['estado'])) {
            $data['estado'] = 'pendiente';
        }
        if (!isset($data['conteo_votos'])) {
            $data['conteo_votos'] = 0;
        }

        $suggestion = Suggestion::create($data);
        return response()->json($suggestion, 201);
    }

    // Mostrar una sugerencia específica
    public function show($id)
    {
        $suggestion = Suggestion::findOrFail($id);
        return response()->json($suggestion);
    }

    // Actualizar una sugerencia existente
    public function update(Request $request, $id)
    {
        $suggestion = Suggestion::findOrFail($id);

        $data = $request->validate([
            'usuario_id'   => 'required|integer|exists:users,id_empleado',
            'titulo'       => 'required|string|max:255',
            'descripcion'  => 'nullable|string',
            'estado'       => 'nullable|string|max:50',
            'conteo_votos' => 'nullable|integer'
        ]);

        $suggestion->update($data);
        return response()->json($suggestion);
    }

    // Eliminar una sugerencia
    public function destroy($id)
    {
        $suggestion = Suggestion::findOrFail($id);
        $suggestion->delete();
        return response()->json(['message' => 'Sugerencia eliminada correctamente']);
    }

    // Método para sumar votos a una sugerencia
    public function addVote($id)
    {
        $suggestion = Suggestion::findOrFail($id);
        $suggestion->increment('conteo_votos');
        return response()->json([
            'message' => 'Voto agregado correctamente',
            'conteo_votos' => $suggestion->conteo_votos
        ]);
    }
}
