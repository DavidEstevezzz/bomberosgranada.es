<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle($request, Closure $next, ...$roles)
    {
        // Asegúrate de que hay un usuario autenticado antes de verificar roles
        if (!$request->user()) {
            Log::debug('Acceso denegado: No hay usuario autenticado');
            return abort(403, 'Unauthorized action - No authenticated user.');
        }

        Log::debug('Verificación de roles', [
            'user_id' => $request->user()->id, // Aquí sí se puede usar `id`, asumiendo que el usuario tiene el método `id`
            'roles_required' => $roles
        ]);

        // Ahora verifica si el usuario tiene alguno de los roles requeridos
        if ($request->user()->hasRole($roles)) {
            return $next($request);
        }

        Log::debug('Acceso denegado: Usuario no tiene los roles requeridos', [
            'user_id' => $request->user()->id, // Asumiendo que el usuario tiene `id`
            'roles_checked' => $roles
        ]);
        return abort(403, 'Unauthorized action - User does not have the required roles.');
    }
}
