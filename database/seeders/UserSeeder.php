<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'nombre' => 'bombero',
            'apellido' => 'bombero',
            'email' => 'bombero@gmail.com',
            'password' => bcrypt('password'),
            'dni' => '564546546',
            'telefono' => '546854',
        ])->assignRole('bombero');

        User::create([
            'nombre' => 'jefe',
            'apellido' => 'jefe',
            'email' => 'jefe@gmail.com',
            'password' => bcrypt('password'),
            'dni' => '564546',
            'telefono' => '54687654',
        ])->assignRole('jefe');
    }
}
