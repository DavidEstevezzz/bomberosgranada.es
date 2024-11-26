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
        Schema::create('commands_assignments', function (Blueprint $table) {
            $table->bigIncrements('id_asignacion_mandos');
            $table->date('fecha_ini');
            $table->unsignedBigInteger('id_empleado');
            $table->string('id_brigada_origen');
            $table->string('id_brigada_destino');
            
            $table->foreign('id_empleado')->references('id_empleado')->on('users');
            $table->foreign('id_brigada_origen')->references('id_brigada')->on('brigades');
            $table->foreign('id_brigada_destino')->references('id_brigada')->on('brigades');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commands_assignments');
    }
};
