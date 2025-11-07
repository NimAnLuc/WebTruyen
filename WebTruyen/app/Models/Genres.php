<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;


class Genres extends Model
{
    use HasFactory;
    protected $table = 'genres';
    protected $fillable = [
        'name',
        'slug',
        'description',
        'status',
        'created_by',
        'updated_by'
    ];
    public function comics(): BelongsToMany
    {
        return $this->belongsToMany(Comics::class, 'comic_genre', 'genre_id', 'comic_id');
    }
}
