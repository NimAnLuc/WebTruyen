<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\HangTruyenListCrawler;
use App\Services\TopTruyenCrawler1;

class CrawlTopTruyenCommand extends Command
{
    protected $signature = 'crawl:hangtruyen-list {url} {--page=1} {--max=5}';
    protected $description = 'Crawl danh sách truyện từ hangtruyen.top theo thể loại (nhiều trang)';

    public function handle()
    {
        $url = $this->argument('url');
        $startPage = intval($this->option('page'));
        $maxPage = intval($this->option('max'));

        $listCrawler = new HangTruyenListCrawler();
        $comicCrawler = new TopTruyenCrawler1();

        set_time_limit(0);
        ini_set('memory_limit', '1024M');

        $this->info("🔹 Bắt đầu crawl danh sách từ: {$url}");

        for ($i = $startPage; $i <= $maxPage; $i++) {
            $pageUrl = $url . '?page=' . $i;
            $this->info("📄 Trang {$i}: {$pageUrl}");

            try {
                $list = $listCrawler->crawlList($pageUrl);
                $this->info("👉 Tìm thấy " . count($list) . " truyện.");

                foreach ($list as $item) {
                    $this->line("🔸 Đang crawl: {$item['title']}");
                    try {
                        dispatch(new \App\Jobs\CrawlComicJob($item['url']));
                        $this->info("📥 Đưa vào queue: {$item['title']}");
                    } catch (\Exception $e) {
                        $this->error("❌ Lỗi truyện: {$item['title']} | " . $e->getMessage());
                    }
                }
            } catch (\Exception $e) {
                $this->error("❌ Lỗi khi tải trang {$pageUrl}: " . $e->getMessage());
            }
        }

        $this->info("🎯 Hoàn tất crawl danh sách thể loại!");
    }
}
