<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckSpecialCommandMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Verificar si el usuario está autenticado
        if (!Auth::check()) {
            return response()->json([
                'message' => 'No autenticado',
                'error' => 'Debe iniciar sesión para acceder a este recurso'
            ], 401);
        }

        // Verificar si el usuario tiene el flag mando_especial en true
        $user = Auth::user();
        if (!$user->mando_especial) {
            return response()->json([
                'message' => 'Acceso denegado',
                'error' => 'No tiene permisos para acceder a este recurso. Se requiere ser mando especial.'
            ], 403);
        }

        return $next($request);
    }
}