<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('firefighters_assignments', function (Blueprint $table) {
        $table->unsignedBigInteger('id_request')->nullable()->after('turno');
        $table->foreign('id_request')->references('id')->on('requests')->onDelete('cascade');
    });
}

public function down()
{
    Schema::table('firefighters_assignments', function (Blueprint $table) {
        $table->dropForeign(['id_request']);
        $table->dropColumn('id_request');
    });
}

};
