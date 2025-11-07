<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class UpdateViewCountJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $chapterId;
    protected $comicId;

    public function __construct($chapterId, $comicId)
    {
        $this->chapterId = $chapterId;
        $this->comicId = $comicId;
    }

    public function handle()
    {
        DB::transaction(function () {
            DB::table('chapters')
                ->where('id', $this->chapterId)
                ->increment('view_count', 1);

            DB::table('comics')
                ->where('id', $this->comicId)
                ->increment('views', 1);
        });
    }
}
