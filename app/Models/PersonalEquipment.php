<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PersonalEquipment extends Model
{
    use HasFactory;

    protected $table = 'equipos_personales';
    
    protected $fillable = [
        'nombre',
        'categoria'
    ];
    
    const CATEGORIA_RADIOS_PORTATILES = 'Radios portátiles';
    const CATEGORIA_PTT_RADIO = 'PTT radio';
    const CATEGORIA_MICRO_ALTAVOZ = 'Micro-altavoz';
    const CATEGORIA_ADAPTADORES_PTT = 'Adaptadores de PTT';
    const CATEGORIA_BATERIAS = 'Baterías radio portátil';
    const CATEGORIA_LINTERNAS_CASCO = 'Linternas de casco';
    const CATEGORIA_LINTERNA_PECHO = 'Linterna de pecho';
    const CATEGORIA_TABLETS = 'Tablets de navegación';
    const CATEGORIA_CARGADORES = 'Cargadores tablets';
    
    public static function getCategorias()
    {
        return [
            self::CATEGORIA_RADIOS_PORTATILES,
            self::CATEGORIA_PTT_RADIO,
            self::CATEGORIA_MICRO_ALTAVOZ,
            self::CATEGORIA_ADAPTADORES_PTT,
            self::CATEGORIA_BATERIAS,
            self::CATEGORIA_LINTERNAS_CASCO,
            self::CATEGORIA_LINTERNA_PECHO,
            self::CATEGORIA_TABLETS,
            self::CATEGORIA_CARGADORES
        ];
    }
}