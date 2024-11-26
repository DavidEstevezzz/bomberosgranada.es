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
        Schema::create('guards', function (Blueprint $table) {
            $table->date('date')->primary();
            $table->string('id_brigada');
            $table->unsignedBigInteger('id_salario');
            $table->foreign('id_brigada')->references('id_brigada')->on('brigades');
            $table->foreign('id_salario')->references('id_salario')->on('salaries');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('guards');
    }
};
