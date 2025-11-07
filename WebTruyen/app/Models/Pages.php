<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pages extends Model
{
    use HasFactory;
    protected $table = 'pages';
    protected $fillable = [
        'comic_id',
        'chapter_id',
        'page_number',
        'image_url',
        'status',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by'
    ];
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapters::class, 'chapter_id');
    }
}
