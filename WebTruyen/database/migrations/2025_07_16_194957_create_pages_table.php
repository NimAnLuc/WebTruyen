// database/migrations/YYYY_MM_DD_create_pages_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_id')->constrained()->onDelete('cascade');
            $table->integer('page_number');
            $table->string('image_url');
            $table->tinyInteger('status')->default(2);
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            
            $table->unique(['chapter_id', 'page_number']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('pages');
    }
};