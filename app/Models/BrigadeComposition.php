<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BrigadeComposition extends Model
{
    use HasFactory;

    protected $table = 'brigade_compositions';

    protected $fillable = [
        'user_id',
        'brigade_id',
        'id_parque',
        'year',
        'month',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
    ];

    /**
     * Relación con el usuario (bombero)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id_empleado');
    }

    /**
     * Relación con la brigada
     */
    public function brigade()
    {
        return $this->belongsTo(Brigade::class, 'brigade_id', 'id_brigada');
    }

    /**
     * Relación con el parque/estación
     */
    public function parque()
    {
        return $this->belongsTo(Park::class, 'id_parque', 'id_parque');
    }

    /**
     * Scope para filtrar por mes y año
     */
    public function scopeByMonthYear($query, $year, $month)
    {
        return $query->where('year', $year)->where('month', $month);
    }

    /**
     * Scope para filtrar por brigada y parque
     */
    public function scopeByBrigadeParque($query, $brigadeId, $parqueId)
    {
        return $query->where('brigade_id', $brigadeId)->where('id_parque', $parqueId);
    }
}