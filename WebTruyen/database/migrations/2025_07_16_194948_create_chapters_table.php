// database/migrations/YYYY_MM_DD_create_chapters_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comic_id')->constrained()->onDelete('cascade');
            $table->decimal('chapter_number', 10, 1);
            $table->string('title')->nullable();
            $table->string('slug');
            $table->bigInteger('view_count')->default(0);
            $table->tinyInteger('status')->default(2);
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->unique(['comic_id', 'chapter_number']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('chapters');
    }
};
