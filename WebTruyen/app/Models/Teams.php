<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Teams extends Model
{
    use HasFactory;
    protected $table = 'teams';
    public function leader()
    {
        return $this->belongsTo(User::class, 'leader_id');
    }
    public function members()
    {
        return $this->hasMany(TeamMembers::class, 'team_id');
    }
}
