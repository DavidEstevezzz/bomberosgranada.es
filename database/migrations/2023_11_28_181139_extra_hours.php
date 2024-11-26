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
        Schema::create('extra_hours', function (Blueprint $table) {
            $table->date('date');
            $table->unsignedBigInteger('id_empleado');
            $table->unsignedBigInteger('id_salario');
            $table->foreign('id_empleado')->references('id_empleado')->on('users');
            $table->foreign('id_salario')->references('id_salario')->on('salaries');
            $table->integer('horas_diurnas');
            $table->integer('horas_nocturnas');
            $table->timestamps();

            $table->primary(['date', 'id_empleado']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('extra_hours');
    }
};
