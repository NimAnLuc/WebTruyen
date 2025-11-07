<?php

namespace App\Services;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Comics;
use App\Models\Genres;
use App\Models\Chapters;
use App\Models\Pages;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
//copy truyện
//php artisan crawl:toptruyen "https://tutientruyen4.fun/truyen-trai-nghiem-tro-thanh-huyet-toc.html" 
class TopTruyenCrawler
{
    private $client;
    private $baseUrl = 'https://tutientruyen4.fun';


    public function __construct()
    {
        $this->client = new Client([
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            ],
            'verify' => false,
        ]);
    }

    public function crawlAndSaveComic($url)
    {
        try {
            Log::info("Bắt đầu xử lý URL: {$url}");
            // Kiểm tra xem truyện đã tồn tại chưa bằng slug
            $path = parse_url($url, PHP_URL_PATH);
            $baseSlug = basename($path); // Lấy phần cuối của path
            $slug = Str::slug($baseSlug); // Tạo slug
            $slug = str_replace(["truyen-", "html"], "", $slug); // Xóa "truyen-" và "html"
            Log::info("Generated slug: {$slug}", ['url' => $url, 'path' => $path, 'base_slug']);

            $existingComic = Comics::where('slug', $slug)->first();
            $comicId = $existingComic ? $existingComic->id : null;

            Log::debug("Kiểm tra comic tồn tại", [
                'slug' => $slug,
                'comic_id' => $comicId,
                'has_chapters' => $comicId ? Chapters::where('comic_id', $comicId)->exists() : false
            ]);
            // Lấy thông tin cơ bản (chỉ lấy title, cover, author, status)
            $comicData = $this->getBasicComicDetail($url);
            Log::info("Đã lấy thông tin cơ bản truyện", ['cover_url' => $comicData['cover']]);

            // Kiểm tra tính hợp lệ của ảnh cover
            if (empty($comicData['cover']) || !$this->isValidImageUrl($comicData['cover'])) {
                Log::error("Ảnh cover không hợp lệ hoặc rỗng", ['cover_url' => $comicData['cover']]);
                throw new \Exception("Ảnh cover không hợp lệ hoặc rỗng: {$comicData['cover']}");
            }

            // Kiểm tra khả năng tải ảnh cover
            $coverPath = $this->downloadAndSaveImage($comicData['cover'], 'covers');
            if (!$coverPath) {
                Log::error("Không thể tải ảnh cover", ['cover_url' => $comicData['cover']]);
                throw new \Exception("Không thể tải ảnh cover: {$comicData['cover']}");
            }
            $comicData['cover'] = $coverPath;
            Log::info("Đã tải ảnh cover", ['new_cover_path' => $comicData['cover']]);
            Log::info("Comic ID: {$comicId}", ['existing_comic' => $existingComic]);
            // Kiểm tra xem comic đã có chapters chưa
            if ($comicId && Chapters::where('comic_id', $comicId)->exists()) {
                Log::info("Comic ID: {$comicId}", ['existing_comic' => $existingComic]);
                Log::info("Comic đã tồn tại và có chapters, chỉ cập nhật ảnh cover", ['comic_id' => $comicId]);
                $comic = $this->saveComic($comicData);
                Log::info("Đã cập nhật comic trong database - ID: {$comic->id}", ['cover_image' => $comic->cover_image]);
                return $comic;
            }

            // Nếu chưa có chapters, crawl dữ liệu chi tiết
            $comicData = $this->getComicDetail($url, $comicId, $comicData);
            Log::info("Đã lấy dữ liệu chi tiết truyện", ['chapters_count' => count($comicData['chapters'])]);

            $comic = $this->saveComic($comicData);
            Log::info("Đã lưu truyện vào database - ID: {$comic->id}", ['cover_image' => $comic->cover_image]);

            $this->saveGenres($comic, $comicData['categories']);
            Log::info("Đã lưu thể loại");

            $this->saveChapters($comic, $comicData['chapters']);
            Log::info("Hoàn tất crawl dữ liệu");

            return $comic;
        } catch (\Exception $e) {
            Log::error("LỖI TRONG QUÁ TRÌNH CRAWL", [
                'url' => $url,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    private function getBasicComicDetail($url)
    {
        try {
            $response = $this->client->request('GET', $url);
            $html = (string)$response->getBody();

            Log::debug("HTML Response (first 500 chars): " . substr($html, 0, 500));

            $crawler = new Crawler($html);
            $coverPath = $this->safeGetAttribute($crawler, '.col-image img', 'src');
            $coverUrl = $this->processCoverUrl($coverPath);

            return [
                'title' => $this->safeGetText($crawler, 'h1.title-detail', 'Tiêu đề'),
                'slug' => Str::slug($this->safeGetText($crawler, 'h1.title-detail', 'no-title')),
                'cover' => $coverUrl,
                'author' => $this->safeGetText($crawler, '.author .col-xs-8', 'Tác giả'),
                'status' => $this->mapStatus($this->safeGetText($crawler, '.status .col-xs-8', 'Đang tiến hành')),
                'categories' => [],
                'description' => '',
                'chapters' => []
            ];
        } catch (\Exception $e) {
            Log::error("Lỗi khi lấy thông tin cơ bản truyện", [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            throw new \Exception("Không thể lấy thông tin cơ bản truyện: " . $e->getMessage());
        }
    }

    private function getComicDetail($url, $comicId = null, $basicData = [])
    {
        try {
            $response = $this->client->request('GET', $url);
            $html = (string)$response->getBody();

            $crawler = new Crawler($html);
            $description = $this->safeGetText($crawler, '.detail-content p', '');
            $categories = $this->getCategories($crawler);
            $chapters = $this->getChaptersData($crawler, $comicId);

            return array_merge($basicData, [
                'description' => $description,
                'categories' => $categories,
                'chapters' => $chapters
            ]);
        } catch (\Exception $e) {
            Log::error("Lỗi khi lấy thông tin chi tiết truyện", [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            throw new \Exception("Không thể lấy thông tin chi tiết truyện: " . $e->getMessage());
        }
    }

    private function downloadAndSaveImage($imageUrl, $folder = 'pages')
    {
        // Kiểm tra URL ảnh hợp lệ và làm sạch URL
        $imageUrl = $this->cleanImageUrl($imageUrl);
        if (!$this->isValidImageUrl($imageUrl)) {
            Log::warning("URL ảnh không hợp lệ trong downloadAndSaveImage: {$imageUrl}");
            return null;
        }

        // Đảm bảo thư mục tồn tại
        $publicPath = public_path($folder);
        if (!file_exists($publicPath)) {
            mkdir($publicPath, 0755, true);
        }

        $filename = Str::uuid()->toString() . '.webp';
        $relativePath = "/{$folder}/{$filename}";
        $fullPath = public_path($relativePath);

        try {
            // Thêm timeout và retry để xử lý mạng không ổn định
            $retryCount = 0;
            $maxRetries = 2;

            while ($retryCount < $maxRetries) {
                try {
                    $response = $this->client->get($imageUrl, [
                        'sink' => $fullPath,
                        'timeout' => 30, // 30 giây timeout
                        'headers' => [
                            'Referer' => $this->baseUrl, // Thêm Referer nếu cần
                        ]
                    ]);

                    // Kiểm tra HTTP status code
                    if ($response->getStatusCode() !== 200) {
                        throw new \Exception("HTTP request failed with status code: " . $response->getStatusCode());
                    }

                    // Kiểm tra kích thước file sau khi tải
                    if (filesize($fullPath) < 1024) { // File quá nhỏ có thể bị lỗi
                        throw new \Exception("Downloaded file is too small, possibly corrupted");
                    }

                    // Sau khi tải thành công, kiểm tra file
                    if (!file_exists($fullPath) || filesize($fullPath) === 0) {
                        throw new \Exception("File tải về không tồn tại hoặc rỗng");
                    }

                    return $relativePath; // Trả về đường dẫn tương đối
                } catch (\GuzzleHttp\Exception\ClientException $e) {
                    // Xử lý lỗi 404, 403, v.v.
                    if ($e->getResponse()->getStatusCode() == 404) {
                        Log::warning("Ảnh không tồn tại (404): {$imageUrl}");
                        break; // Không retry với lỗi 404
                    }
                    $retryCount++;
                    if ($retryCount >= $maxRetries) {
                        throw $e;
                    }
                    sleep(1); // Chờ 1 giây trước khi retry
                }
            }

            return null;
        } catch (\Exception $e) {
            // Xóa file nếu tải thất bại
            if (file_exists($fullPath)) {
                @unlink($fullPath);
            }
            Log::error("Lỗi khi tải ảnh từ {$imageUrl}: " . $e->getMessage());
            return null;
        }
    }

    private function cleanImageUrl($url)
    {
        // Loại bỏ ký tự xuống dòng và khoảng trắng thừa
        $url = trim($url);

        // Loại bỏ các tham số URL không cần thiết (nếu có)
        $url = preg_replace('/\?.*$/', '', $url);

        // Mã hóa URL đúng cách
        $parts = parse_url($url);
        if ($parts === false) {
            return $url;
        }

        $path = isset($parts['path']) ? implode('/', array_map('rawurlencode', explode('/', $parts['path']))) : '';
        $url = '';

        if (isset($parts['scheme'])) {
            $url .= $parts['scheme'] . '://';
        }

        if (isset($parts['host'])) {
            $url .= $parts['host'];
        }

        if (!empty($path)) {
            $url .= $path;
        }

        if (isset($parts['query'])) {
            $url .= '?' . $parts['query'];
        }

        return $url;
    }

    private function isValidImageUrl($url)
    {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        // Kiểm tra phần mở rộng ảnh
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        $extension = strtolower(pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION));
        $extension = preg_replace('/\?.*$/', '', $extension); // Loại bỏ query string nếu có

        return in_array($extension, $allowedExtensions);
    }

    private function processCoverUrl($coverPath)
    {
        if (empty($coverPath)) {
            return null;
        }

        // Nếu URL đã đầy đủ
        if (str_starts_with($coverPath, 'http')) {
            return $coverPath;
        }

        // Xử lý URL tương đối
        $baseUrl = rtrim($this->baseUrl, '/');

        // Trường hợp URL bắt đầu bằng /
        if (str_starts_with($coverPath, '/')) {
            return $baseUrl . $coverPath;
        }

        // Trường hợp đường dẫn tương đối khác
        return $baseUrl . '/' . ltrim($coverPath, '/');
    }

    private function safeGetText(Crawler $crawler, $selector, $default = '')
    {
        try {
            if ($crawler->filter($selector)->count() === 0) {
                Log::warning("Không tìm thấy selector: {$selector}");
                return $default;
            }
            return trim($crawler->filter($selector)->text());
        } catch (\Exception $e) {
            Log::warning("Lỗi khi lấy text từ selector {$selector}: " . $e->getMessage());
            return $default;
        }
    }

    private function safeGetAttribute(Crawler $crawler, $selector, $attribute, $default = '')
    {
        try {
            if ($crawler->filter($selector)->count() === 0) {
                Log::warning("Không tìm thấy selector: {$selector}");
                return $default;
            }
            return $crawler->filter($selector)->attr($attribute) ?? $default;
        } catch (\Exception $e) {
            Log::warning("Lỗi khi lấy thuộc tính {$attribute} từ selector {$selector}: " . $e->getMessage());
            return $default;
        }
    }

    private function getCategories(Crawler $crawler)
    {
        try {
            if ($crawler->filter('li.kind .col-xs-8 a')->count() === 0) {
                Log::warning("Không tìm thấy thể loại với selector 'li.kind .col-xs-8 a'");
                return [];
            }

            return $crawler->filter('li.kind .col-xs-8 a')->each(function (Crawler $node) {
                $text = trim($node->text());
                Log::debug("Tìm thấy thể loại: {$text}");
                return $text;
            });
        } catch (\Exception $e) {
            Log::error("Lỗi khi lấy thể loại: " . $e->getMessage());
            return [];
        }
    }

    private function getChaptersData(Crawler $crawler, $comicId = null)
    {
        $chapters = [];

        $crawler->filter('.list_chapter li.row')->each(function (Crawler $node) use (&$chapters, $comicId) {
            try {
                $chapterNode = $node->filter('.chapter a');
                if ($chapterNode->count() === 0) return;

                $href = $chapterNode->attr('href');
                $chapterName = $chapterNode->text();
                $dataId = $chapterNode->attr('data-id');

                preg_match('/\d+(\.\d+)?/', $chapterName, $matches);
                $chapterNumber = $matches[0] ?? 0;

                if (
                    $comicId && Chapters::where('comic_id', $comicId)
                    ->where('chapter_number', $chapterNumber)
                    ->exists()
                ) {
                    Log::info("Chapter {$chapterNumber} đã tồn tại, bỏ qua");
                    return;
                }

                $timeText = $node->filter('.col-xs-4.text-center.small')->text();
                $updatedAt = $this->convertTimeTextToTimestamp(trim($timeText));

                $viewCount = (int)$node->filter('.col-xs-2.text-center.small')->text();

                $chapterUrl = str_starts_with($href, 'http')
                    ? $href
                    : $this->baseUrl . '/' . ltrim($href, '/');

                $chapters[] = [
                    'name' => $chapterName,
                    'number' => (float)$chapterNumber,
                    'url' => $chapterUrl,
                    'slug' => Str::slug($chapterName),
                    'data_id' => $dataId,
                    'updated_at' => $updatedAt,
                    'view_count' => $viewCount,
                    'pages' => $this->getChapterPages($chapterUrl, $comicId, $chapterNumber)
                ];
            } catch (\Exception $e) {
                Log::error("Error processing chapter: " . $e->getMessage());
            }
        });

        usort($chapters, function ($a, $b) {
            return $b['number'] <=> $a['number'];
        });

        return $chapters;
    }

    private function convertTimeTextToTimestamp($timeText)
    {
        if (str_contains($timeText, 'giờ')) {
            $hours = (int)trim(str_replace('giờ trước', '', $timeText));
            return now()->subHours($hours)->toDateTimeString();
        } elseif (str_contains($timeText, 'ngày')) {
            $days = (int)trim(str_replace('ngày trước', '', $timeText));
            return now()->subDays($days)->toDateTimeString();
        } elseif (str_contains($timeText, 'tuần')) {
            $weeks = (int)trim(str_replace('tuần trước', '', $timeText));
            return now()->subWeeks($weeks)->toDateTimeString();
        } elseif (str_contains($timeText, 'tháng')) {
            $months = (int)trim(str_replace('tháng trước', '', $timeText));
            return now()->subMonths($months)->toDateTimeString();
        }

        return now()->toDateTimeString();
    }

    private function getChapterPages($chapterUrl, $comicId = null, $chapterNumber = null)
    {
        if ($comicId && $chapterNumber) {
            $existingChapter = Chapters::where('comic_id', $comicId)
                ->where('chapter_number', $chapterNumber)
                ->first();

            if ($existingChapter && $existingChapter->pages()->count() > 0) {
                Log::info("Chapter {$chapterNumber} đã tồn tại với đầy đủ pages, bỏ qua crawl pages");
                return [];
            }
        }

        try {
            Log::info("Đang lấy pages từ chapter URL: {$chapterUrl}");

            $response = $this->client->request('GET', $chapterUrl);
            $html = (string)$response->getBody();
            $crawler = new Crawler($html);

            if ($crawler->filter('.page-chapter img')->count() === 0) {
                Log::error("KHÔNG TÌM THẤY TRANG - Kiểm tra selector .page-chapter img");
                return [];
            }

            $pages = $crawler->filter('.page-chapter img')->each(function (Crawler $node, $i) {
                $imageUrl = $node->attr('src') ?? $node->attr('data-src');
                $imageUrl = $this->cleanImageUrl($imageUrl);

                if (!$this->isValidImageUrl($imageUrl)) {
                    Log::warning("URL ảnh không hợp lệ, bỏ qua: {$imageUrl}");
                    return null;
                }

                Log::debug("Page {$i}: {$imageUrl}");
                return [
                    'page_number' => $i + 1,
                    'image_url' => $imageUrl
                ];
            });

            $pages = array_filter($pages);

            Log::info("Đã lấy được " . count($pages) . " pages");
            return $pages;
        } catch (\Exception $e) {
            Log::error("Lỗi khi lấy pages từ chapter {$chapterUrl}: " . $e->getMessage());
            return [];
        }
    }

    private function mapStatus($statusText)
    {
        $statusMap = [
            'Đang tiến hành' => 'ongoing',
            'Hoàn thành' => 'completed',
            'Tạm ngưng' => 'hiatus'
        ];

        return $statusMap[$statusText] ?? 'ongoing';
    }

    private function saveComic($data)
    {
        $existingComic = Comics::where('slug', $data['slug'])->first();
        $coverUrl = $existingComic->cover_image ?? null; // Mặc định giữ ảnh cũ nếu có
        $oldCoverPath = $existingComic->cover_image ?? null; // Lưu đường dẫn ảnh cũ

        // Xử lý ảnh cover
        if (!empty($data['cover'])) {
            $coverUrl = $data['cover']; // Sử dụng đường dẫn mới từ crawlAndSaveComic
            Log::info("Sử dụng đường dẫn ảnh cover mới: {$coverUrl}");

            // Xóa ảnh cover cũ nếu tồn tại và ảnh mới khác ảnh cũ
            if ($oldCoverPath && $oldCoverPath !== $coverUrl) {
                $this->deleteOldImage($oldCoverPath);
                Log::info("Đã xóa ảnh cover cũ: {$oldCoverPath}");
            }
        } else {
            Log::warning("Không có ảnh cover mới, giữ nguyên ảnh cũ (nếu có): {$coverUrl}");
        }

        return Comics::updateOrCreate(
            ['slug' => $data['slug']],
            [
                'title' => $data['title'],
                'description' => $data['description'] ?? '',
                'author_name' => $data['author'],
                'comic_status' => $data['status'],
                'cover_image' => $coverUrl, // Lưu đường dẫn ảnh (mới hoặc cũ)
                'status' => 1,
                'created_by' => 1,
                'updated_by' => 1,
            ]
        );
    }

    private function saveGenres(Comics $comic, array $genres)
    {
        $genreIds = [];

        foreach ($genres as $genreName) {
            $genre = Genres::firstOrCreate(
                ['slug' => Str::slug($genreName)],
                [
                    'name' => $genreName,
                    'status' => 1,
                    'created_by' => 1,
                    'updated_by' => 1,
                ]
            );

            $genreIds[] = $genre->id;
        }

        $comic->genres()->sync($genreIds);
    }

    private function saveChapters(Comics $comic, array $chapters)
    {
        foreach ($chapters as $chapterData) {
            if (Chapters::where('comic_id', $comic->id)
                ->where('chapter_number', $chapterData['number'])
                ->exists()
            ) {
                Log::info("Chapter {$chapterData['number']} đã tồn tại, bỏ qua toàn bộ chapter");
                continue;
            }

            Log::info("Bắt đầu xử lý chapter {$chapterData['number']}");

            $chapter = new Chapters([
                'comic_id' => $comic->id,
                'chapter_number' => $chapterData['number'],
                'title' => $chapterData['name'],
                'slug' => $chapterData['slug'],
                'status' => 1,
                'created_by' => 1,
                'updated_by' => 1,
            ]);
            $chapter->save();

            $pages = [];
            foreach ($chapterData['pages'] as $pageData) {
                try {
                    $localImagePath = $this->downloadAndSaveImage($pageData['image_url'], 'pages');
                    if ($localImagePath) {
                        $pages[] = [
                            'page_number' => $pageData['page_number'],
                            'image_url' => $localImagePath,
                            'status' => 1,
                            'created_by' => 1,
                            'updated_by' => 1,
                        ];
                    }
                } catch (\Exception $e) {
                    Log::error("Lỗi khi tải trang {$pageData['page_number']}: " . $e->getMessage());
                    continue;
                }
            }

            if (!empty($pages)) {
                $chapter->pages()->createMany($pages);
                Log::info("Đã thêm chapter {$chapterData['number']} với " . count($pages) . " pages");
            }
        }
    }

    private function deleteOldImage($imagePath)
    {
        if (empty($imagePath)) {
            Log::warning("Không thể xóa ảnh: đường dẫn rỗng");
            return false;
        }

        try {
            $imagePath = ltrim($imagePath, '/');
            $fullPath = public_path($imagePath);

            if (file_exists($fullPath) && is_writable($fullPath)) {
                if (unlink($fullPath)) {
                    Log::info("Đã xóa thành công ảnh cũ: {$imagePath}");
                    return true;
                } else {
                    Log::error("Không thể xóa ảnh: {$imagePath}");
                    return false;
                }
            } else {
                Log::warning("File ảnh không tồn tại hoặc không có quyền ghi: {$imagePath}");
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Lỗi khi xóa ảnh cũ: " . $e->getMessage());
            return false;
        }
    }
}
