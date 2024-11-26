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
        Schema::create('requests', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('id_empleado');
            $table->unsignedBigInteger('id_empleado2')->nullable();
            $table->enum('tipo', ['cambio de turno', 'vacaciones', 'asuntos propios', 'salidas personales']);
            $table->date('fecha');
            $table->string('motivo')->nullable();
            $table->foreign('id_empleado')->references('id_empleado')->on('users');
            $table->foreign('id_empleado2')->references('id_empleado')->on('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requests');
    }
};
