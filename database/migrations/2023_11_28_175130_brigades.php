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
        Schema::create('brigades', function (Blueprint $table) {
            $table->string('id_brigada')->primary();
            $table->unsignedBigInteger('id_parque');
            $table->foreign('id_parque')->references('id_parque')->on('parks');
            $table->string('nombre');
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};