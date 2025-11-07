<?php

namespace App\Jobs;

use App\Services\TopTruyenCrawler1;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class CrawlComicJob implements ShouldQueue
{
    use Dispatchable;

    public $url;

    public function __construct($url)
    {
        $this->url = $url;
    }

    public function handle()
    {
        $crawler = new TopTruyenCrawler1();
        $crawler->crawlAndSaveComic($this->url);
    }
}
