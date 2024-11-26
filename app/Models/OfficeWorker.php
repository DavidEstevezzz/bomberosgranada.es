<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfficeWorker extends User
{
    use HasFactory;

    protected $fillable = [
        'id_parque', // Atributo adicional para OfficeWorker
    ];

    public function park()
    {
        return $this->belongsTo(Park::class, 'id_parque');
    }
}
