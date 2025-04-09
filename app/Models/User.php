<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasRoles, HasFactory, Notifiable;

    protected $primaryKey = 'id_empleado';

    public $incrementing = true;

    protected $appends = ['role_name'];

    protected $fillable = [
        'nombre',
        'email',
        'apellido',
        'dni',
        'telefono',
        'password',
        'type',
        'puesto',
        'AP',
        'email2',
        'vacaciones',
        'modulo',
        'compensacion_grupos',
        'horas_sindicales',
        'traslados',
        'basura',
        'fecha_basura',
        'practicas',
        'mando_especial',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'roles',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'mando_especial' => 'boolean',
    ];

    public function getRoleNameAttribute()
    {
        return $this->roles->pluck('name')->join(', ');
    }

    public function setNombreAttribute($value)
    {
        $this->attributes['nombre'] = ucwords(strtolower($value));
    }

    public function setApellidoAttribute($value)
    {
        $this->attributes['apellido'] = ucwords(strtolower($value));
    }

    public function envia()
    {
        return $this->hasMany('App\Models\Request', 'id_empleado');
    }

    public function implica()
    {
        return $this->hasMany('App\Models\Request', 'id_empleado2');
    }

    public function personalsIncidents()
    {
        return $this->hasMany('App\Models\PersonalsIncident');
    }
}
