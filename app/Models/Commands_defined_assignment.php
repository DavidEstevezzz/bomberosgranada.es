<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commands_defined_assignment extends Commands_assignment
{
    use HasFactory;

    public function Commands_assignment()
    {
        return $this->belongsTo('App\Models\Commands_assignment');
    }
}
