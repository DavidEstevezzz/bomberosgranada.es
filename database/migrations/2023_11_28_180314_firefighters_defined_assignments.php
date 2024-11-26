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
        
        Schema::create('firefighters_defined_assignments', function (Blueprint $table) {
            $table->unsignedBigInteger('id_asignacion')->primary();
            $table->date('fecha_fin');
            $table->timestamps();
        
            $table->foreign('id_asignacion')->references('id_asignacion')->on('firefighters_assignments');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('firefighters_defined_assignments');
    }
};
