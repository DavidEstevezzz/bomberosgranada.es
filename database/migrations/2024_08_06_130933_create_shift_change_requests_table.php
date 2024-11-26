<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateShiftChangeRequestsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('shift_change_requests', function (Blueprint $table) {
            $table->id(); // Crea una columna id auto-incremental de tipo BIGINT
            $table->unsignedBigInteger('id_empleado1');
            $table->unsignedBigInteger('id_empleado2');
            $table->unsignedBigInteger('id_empleado3')->nullable();
            $table->unsignedInteger('brigada1'); // Asegúrate de usar el tipo que coincide con 'id_brigada' en 'brigades'
            $table->unsignedInteger('brigada2'); // Asegúrate de usar el tipo que coincide con 'id_brigada' en 'brigades'
            $table->date('fecha1');
            $table->date('fecha2');
            $table->text('motivo');
            $table->enum('estado', ['rechazado', 'aceptado_por_empleados', 'en_tramite', 'aceptado']);
            $table->timestamps();

            $table->foreign('id_empleado1')->references('id_empleado')->on('users')->onDelete('cascade');
            $table->foreign('id_empleado2')->references('id_empleado')->on('users')->onDelete('cascade');
            $table->foreign('id_empleado3')->references('id_empleado')->on('users')->onDelete('set null');
            $table->foreign('brigada1')->references('id_brigada')->on('brigades')->onDelete('cascade');
            $table->foreign('brigada2')->references('id_brigada')->on('brigades')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('shift_change_requests');
    }
}
