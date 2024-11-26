<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $role1 = Role::create (['name' => 'jefe']);
        $role2 =  Role::create (['name' => 'mando']);
        $role3 = Role::create (['name' => 'bombero']);
        $role4 = Role::create (['name' => 'empleado']);

        Permission::create(['name' => 'users.index'])->syncRoles([$role1, $role2, $role3, $role4]);
        Permission::create(['name' => 'users.show'])->syncRoles([$role1]);
        Permission::create(['name' => 'users.update'])->syncRoles([$role1]);
        Permission::create(['name' => 'users.store'])->syncRoles([$role1]);
    }
}
