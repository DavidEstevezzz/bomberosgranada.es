<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Personals_incident extends Incident
{
    use HasFactory;

    public function Incident()
    {
        return $this->belongsTo('App\Models\Incident');
    }

    public function User()
    {
        return $this->belongsTo('App\Models\User');
    }
}
