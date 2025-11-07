<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Contacts extends Model
{
    use HasFactory;
    protected $table = 'contacts';
    protected $fillable = [
        'name',
        'email',
        'phone',
        'title',
        'content',
        'status',
        'replay_id',
        'user_id',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
    ];
}
