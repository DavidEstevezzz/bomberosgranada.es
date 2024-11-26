<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commands_assignment extends Model
{
    use HasFactory;

    public function Brigade()
    {
        return $this->hasOne('App\Models\Brigade');
    }

    public function Command()
    {
        return $this->hasOne('App\Models\Command');
    }
}
