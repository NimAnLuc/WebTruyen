<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TeamMembers extends Model
{
    use HasFactory;
    protected $table = 'team_members';
        protected $fillable = [
        'team_id',
        'user_id',
        'role',
        'status',
        'created_by',
        'updated_by',
    ];
    public function team()
    {
        return $this->belongsTo(Teams::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
