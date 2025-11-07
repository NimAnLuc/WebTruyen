<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Bookmarks extends Model
{
    use HasFactory;
    protected $table = 'bookmarks';
      protected $fillable = [
        'user_id',
        'comic_id',
        'status',
        'created_by',
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comic()
    {
        return $this->belongsTo(Comics::class);
    }
}
