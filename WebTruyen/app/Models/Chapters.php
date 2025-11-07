<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chapters extends Model
{
    use HasFactory;
    protected $table = 'chapters';
    protected $fillable = [
        'comic_id', // Thêm vào đây
        'chapter_number',
        'title',
        'slug',
        'view_count',
        'status',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
    ];
    public function comic()
    {
        return $this->belongsTo(Comics::class);
    }
     public function pages(): HasMany
    {
        return $this->hasMany(Pages::class, 'chapter_id');
    }
}
