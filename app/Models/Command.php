<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Command extends User
{
    use HasFactory;
    
    protected $fillable = [
        'puesto', // Atributo adicional para Firefighter
    ];

    public function commandsAssignment()
    {
        return $this->hasOne('App\Models\Commands_assignment');
    }

    public function incidents()
    {
        return $this->hasMany('App\Models\Incident');
    }
}
