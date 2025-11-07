// database/migrations/YYYY_MM_DD_create_comic_genre_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('comic_genre', function (Blueprint $table) {
            $table->foreignId('comic_id')->constrained()->onDelete('cascade');
            $table->foreignId('genre_id')->constrained()->onDelete('cascade');
            $table->primary(['comic_id', 'genre_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('comic_genre');
    }
};