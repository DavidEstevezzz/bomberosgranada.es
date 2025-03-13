<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SuggestionVote;
use Illuminate\Database\QueryException;
use App\Models\Suggestion;

class SuggestionVoteController extends Controller
{
    public function store(Request $request)
    {
        // Validación de datos
        $data = $request->validate([
            'suggestion_id' => 'required|integer|exists:suggestions,id',
            'usuario_id'    => 'required|integer|exists:users,id_empleado'
        ]);

        try {
            // Se intenta crear el voto
            $vote = SuggestionVote::create($data);

            $suggestion = Suggestion::find($data['suggestion_id']);
            $suggestion->increment('conteo_votos');

            return response()->json([
                'message' => 'Voto registrado correctamente',
                'vote'    => $vote
            ], 201);
        } catch (QueryException $e) {
            // Capturamos el error por violación de la restricción única
            return response()->json([
                'message' => 'El usuario ya ha votado por esta sugerencia'
            ], 409);
        }
    }

    public function destroy(Request $request)
    {
        // Validamos los datos necesarios
        $data = $request->validate([
            'suggestion_id' => 'required|integer|exists:suggestions,id',
            'usuario_id'    => 'required|integer|exists:users,id_empleado'
        ]);

        // Buscamos el voto correspondiente
        $vote = SuggestionVote::where('suggestion_id', $data['suggestion_id'])
            ->where('usuario_id', $data['usuario_id'])
            ->first();
        // En el método destroy del controlador de votos, luego de eliminar el voto:
        $suggestion = Suggestion::find($data['suggestion_id']);
        $suggestion->decrement('conteo_votos');

        if (!$vote) {
            return response()->json([
                'message' => 'No se encontró el voto para eliminar'
            ], 404);
        }

        // Eliminamos el voto
        $vote->delete();

        return response()->json([
            'message' => 'Voto eliminado correctamente'
        ]);
    }
}
