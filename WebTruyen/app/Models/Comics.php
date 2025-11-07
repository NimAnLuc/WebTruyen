<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Comics extends Model
{
    use HasFactory;
    protected $fillable = [
        'title',
        'slug',
        'description',
        'author_name',
        'team_id',
        'comic_status',
        'cover_image',
        'status',
        'views',
        'created_by',
        'created_at',
        'updated_at',
        'updated_by',
    ];

    public function team()
    {
        return $this->belongsTo(Teams::class, 'team_id');
    }
    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genres::class, 'comic_genre', 'comic_id', 'genre_id');
    }
     public function chapters(): HasMany
    {
        return $this->hasMany(Chapters::class, 'comic_id');
    }
}
