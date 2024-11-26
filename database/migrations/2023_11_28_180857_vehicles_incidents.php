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
        Schema::create('vehicles_incidents', function (Blueprint $table) {
            $table->unsignedBigInteger('id_incidencia')->primary();
            $table->foreign('id_incidencia')->references('id_incidencia')->on('incidents');
            $table->string('matricula');
            $table->foreign('matricula')->references('matricula')->on('vehicles');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles_incidents');
    }
};
