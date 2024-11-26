<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Incident extends Model
{
    use HasFactory;

    public function Head()
    {
        return $this->belongTo('App\Models\Head');
    }

    public function Command()
    {
        return $this->belongTo('App\Models\Command');
    }
}
