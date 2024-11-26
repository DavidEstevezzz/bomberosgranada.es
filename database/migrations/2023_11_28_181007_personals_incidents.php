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
        Schema::create('personals_incidents', function (Blueprint $table) {
            $table->unsignedBigInteger('id_incidencia')->primary();
            $table->unsignedBigInteger('id_empleado2');
            $table->foreign('id_incidencia')->references('id_incidencia')->on('incidents');
            $table->foreign('id_empleado2')->references('id_empleado')->on('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personals_incidents');
    }
};
