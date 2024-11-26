<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicles_incident extends Incident
{
    use HasFactory;

    public function Vehicle()
    {
        return $this->belongsTo('App\Models\Vehicle');
    }

    public function Incident()
    {
        return $this->belongsTo('App\Models\Incident');
    }
}
