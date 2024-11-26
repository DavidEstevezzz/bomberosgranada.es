<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    public function Vehicles_incident()
    {
        return $this->hasMany('App\Models\Vehicles_incident');
    }

    public function Park()
    {
        return $this->belongsTo('App\Models\Park');
    }
}
