<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthSpecialCommand
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Verificar si el usuario está autenticado
        if (!$user) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        // Verificar si tiene rol de Jefe o Mando, O si tiene mando_especial = 1
        $hasRole = $user->hasAnyRole(['Jefe', 'Mando']);
        $hasMandoEspecial = $user->mando_especial == 1;

        if ($hasRole || $hasMandoEspecial) {
            return $next($request);
        }

        return response()->json(['message' => 'No tienes permisos para realizar esta acción'], 403);
    }
}