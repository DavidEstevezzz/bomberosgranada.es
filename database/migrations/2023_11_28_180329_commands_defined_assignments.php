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
        Schema::create('commands_defined_assignments', function (Blueprint $table) {
            $table->unsignedBigInteger('id_asignacion_mandos')->primary();
            $table->date('fecha_fin');
            $table->timestamps();
            
            $table->foreign('id_asignacion_mandos')->references('id_asignacion_mandos')->on('commands_assignments');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commands_defined_assignments');
    }
};
