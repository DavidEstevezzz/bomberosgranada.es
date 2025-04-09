<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Brigade extends Model
{
    use HasFactory;

    protected $table = 'brigades';
    protected $primaryKey = 'id_brigada';
    public $incrementing = true;

    protected $fillable = [
        'id_parque',
        'nombre'
    ];

    public function park()
    {
        return $this->belongsTo('App\Models\Park', 'id_parque', 'id_parque');
    }

    public function firefightersAssignments()
    {
        return $this->hasMany('App\Models\FirefightersAssignment', 'brigade_id');
    }

    public function commandsAssignments()
    {
        return $this->hasMany('App\Models\CommandsAssignment', 'brigade_id');
    }

    // Nueva relación con usuarios a través de la tabla pivot
    public function users()
    {
        return $this->belongsToMany(User::class, 'brigade_user', 'id_brigada', 'id_usuario')
                    ->withPivot('practicas')
                    ->withTimestamps();
    }

    // Relación directa con la tabla pivot
    public function brigadeUsers()
    {
        return $this->hasMany(BrigadeUser::class, 'id_brigada', 'id_brigada');
    }
}