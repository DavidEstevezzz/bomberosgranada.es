<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('salaries', function (Blueprint $table) {
            $table->bigIncrements('id_salario');
            $table->date('fecha_ini');
            $table->enum('tipo', ['laborable', 'festivo', 'prefestivo']);
            $table->decimal('precio_diurno', 10, 2);
            $table->decimal('precio_nocturno', 10, 2);
            $table->integer('horas_nocturnas');
            $table->integer('horas_diurnas');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salaries');
    }
};