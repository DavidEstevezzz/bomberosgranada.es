<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Intervention extends Model
{
    protected $table = 'intervenciones';
    protected $primaryKey = 'parte';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['id_guard', 'parte', 'tipo', 'mando'];

    // Relación con la tabla guards
    public function guardia()
    {
        return $this->belongsTo(Guard::class, 'id_guard');
    }

    // Relación con la tabla users (empleados)
    public function user()
    {
        return $this->belongsTo(User::class, 'mando', 'id_empleado');
    }
}
