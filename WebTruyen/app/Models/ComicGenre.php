<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ComicGenre extends Model
{
    use HasFactory;
    protected $table = 'comic_genre';
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
        'updated_by',
    ];
    public function team()
    {
        return $this->belongsTo(Teams::class);
    }
}
