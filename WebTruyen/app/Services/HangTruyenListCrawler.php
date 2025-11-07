<?php

namespace App\Services;

use Symfony\Component\DomCrawler\Crawler;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class HangTruyenListCrawler
{
    protected string $baseUrl = 'https://hangtruyen.top';

    public function crawlList(string $url)
    {
        $response = Http::timeout(15)->get($url);
        if (!$response->successful()) {
            dd($response->status(), $response->body());
            throw new \Exception("Không thể tải trang: $url");
        }


        $html = $response->body();
        $crawler = new Crawler($html);

        $items = [];

        // Duyệt qua từng truyện trong div.list-genre
        $crawler->filter('.list-genre .m-post')->each(function (Crawler $node) use (&$items) {
            try {
                $title = $node->filter('.m-name a')->text();
                $href = $node->filter('.m-name a')->attr('href');
                $image = $node->filter('img')->attr('data-src') ?? $node->filter('img')->attr('src');
                $rating = $node->filter('.group-star .m-star span')->eq(1)->text('');
                $chapter = $node->filter('.chapter a')->text('');
                $chapter_url = $node->filter('.chapter a')->attr('href');

                $items[] = [
                    'title' => trim($title),
                    'url' => $this->normalizeUrl($href),
                    'image' => $image,
                    'rating' => floatval($rating),
                    'latest_chapter' => trim($chapter),
                    'chapter_url' => $this->normalizeUrl($chapter_url),
                ];
            } catch (\Exception $e) {
                // Bỏ qua phần tử lỗi
            }
        });

        return $items;
    }

    protected function normalizeUrl($path)
    {
        if (Str::startsWith($path, 'http')) {
            return $path;
        }
        return rtrim($this->baseUrl, '/') . '/' . ltrim($path, '/');
    }
}
