<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EquipmentAssignment extends Model
{
    use HasFactory;

    /**
     * Los atributos que son asignables masivamente.
     *
     * @var array
     */
    protected $fillable = [
        'categoria',
        'numero',
        'parque',
        'asignacion',
        'fecha',
        'activo'
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos.
     *
     * @var array
     */
    protected $casts = [
        'numero' => 'integer',
        'parque' => 'integer',
        'activo' => 'boolean',
        'fecha' => 'date'
    ];
}