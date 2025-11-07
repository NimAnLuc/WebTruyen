<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TeamJoin extends Model
{
    use HasFactory;
    protected $table = 'team_join';
    protected $fillable = [
        'team_id',
        'user_id',
        'requested_role',
        'approver_id',
        'status',
        'message',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
    ];

    // Quan hệ với Team
    public function team()
    {
        return $this->belongsTo(Teams::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    // Quan hệ với bảng users (cho approver_id)
    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
