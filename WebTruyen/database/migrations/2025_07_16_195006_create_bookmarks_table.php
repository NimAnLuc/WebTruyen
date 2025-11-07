<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('comic_id')->constrained()->onDelete('cascade');
            $table->tinyInteger('status')->default(2);
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            // Ràng buộc unique để đảm bảo không có bản ghi trùng lặp cho cặp user_id và comic_id
            $table->unique(['user_id', 'comic_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('bookmarks');
    }
};