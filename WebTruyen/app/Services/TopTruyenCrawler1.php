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
use GuzzleHttp\Promise;
use GuzzleHttp\Pool;
use Illuminate\Support\Facades\Cache;
use Cloudinary\Cloudinary;

//copy truyện

//php artisan crawl:toptruyen https://hangtruyen.top/truyen-tranh/ta-muon-tro-thanh-chua-te-bong-toi
class TopTruyenCrawler1
{
    private $client;
    // private $baseUrl1 = 'https://tutientruyen4.fun';
    private $baseUrl = 'https://hangtruyen.top/';

    public function __construct()
    {
        $this->client = new Client([
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            ],
            'timeout' => 30,           // ⏱️ Thời gian tối đa cho 1 request (giúp không kẹt vô hạn)
            'connect_timeout' => 5,    // ⏳ Giới hạn thời gian kết nối ban đầu
            'read_timeout' => 15,      // 🧩 Thời gian chờ dữ liệu tải về
            'verify' => false,         // ❌ Bỏ xác thực SSL (nhiều site free có SSL lỗi)
            'http_errors' => false,    // ⚙️ Không throw exception khi 404, 500
            'allow_redirects' => true, // 🔁 Tự theo dõi redirect
        ]);
    }

    private function uploadToCloudinary($filePath, $folder = 'comics')
    {
        try {
            $cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => config('services.cloudinary.cloud_name'),
                    'api_key'    => config('services.cloudinary.api_key'),
                    'api_secret' => config('services.cloudinary.api_secret'),
                ],
            ]);

            $upload = $cloudinary->uploadApi()->upload($filePath, [
                'folder' => $folder,
                'resource_type' => 'image',
                'format' => 'webp',
                'quality' => 'auto',
            ]);

            return $upload['secure_url'];
        } catch (\Exception $e) {
            Log::error("Upload Cloudinary thất bại: " . $e->getMessage());
            return null;
        }
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
    //khúc này là nó lưu dữ liệu vào cache Cache::remember
    private function fetchHtmlCached($url, $minutes = 10)
    {
        return Cache::remember('crawl_' . md5($url), now()->addMinutes($minutes), function () use ($url) {
            try {
                // Dùng lại client có cấu hình chuẩn từ __construct()
                $response = $this->client->request('GET', $url);

                if ($response->getStatusCode() !== 200) {
                    Log::warning("⚠️ Không tải được {$url} (HTTP " . $response->getStatusCode() . ")");
                    return '';
                }

                return (string) $response->getBody();
            } catch (\GuzzleHttp\Exception\RequestException $e) {
                Log::error("❌ Lỗi tải HTML: {$url} - " . $e->getMessage());
                return '';
            } catch (\Exception $e) {
                Log::error("❌ Lỗi không xác định khi tải {$url}: " . $e->getMessage());
                return '';
            }
        });
    }
    // private function downloadImagesAsync(array $imageUrls, $folder = 'pages', $concurrency = 10)
    // {
    //     $client = $this->client;
    //     $results = [];
    //     $promises = [];

    //     $storageFolder = "public/{$folder}";
    //     $publicFolder = "storage/{$folder}";

    //     if (!Storage::exists($storageFolder)) {
    //         Storage::makeDirectory($storageFolder);
    //     }
    //     $absoluteDir = storage_path("app/{$storageFolder}");
    //     if (!is_dir($absoluteDir)) {
    //         mkdir($absoluteDir, 0755, true);
    //     }


    //     foreach ($imageUrls as $key => $url) {
    //         $url = $this->cleanImageUrl($url);
    //         $filename = Str::uuid()->toString() . '.webp';
    //         $relativePath = "/{$publicFolder}/{$filename}";
    //         $absolutePath = storage_path("app/{$storageFolder}/{$filename}");

    //         $promises[$key] = $client->getAsync($url, [
    //             'sink' => $absolutePath,
    //             'timeout' => 60,
    //             'connect_timeout' => 5,
    //         ])->then(function () use ($relativePath) {
    //             return $relativePath;
    //         })->otherwise(function ($e) use ($url) {
    //             Log::error("Lỗi tải async ảnh: {$url} - " . $e->getMessage());
    //             return null;
    //         });
    //     }

    //     $responses = Promise\Utils::settle($promises)->wait();

    //     foreach ($responses as $key => $response) {
    //         $results[$key] = $response['value'] ?? null;
    //     }

    //     return array_filter($results);
    // }
    private function downloadImagesAsync(array $imageUrls, $folder = 'pages')
    {
        $results = [];
        foreach ($imageUrls as $key => $url) {
            $cloudUrl = $this->downloadAndSaveImage($url, $folder);
            $results[$key] = $cloudUrl;
        }
        return array_filter($results);
    }

    private function getBasicComicDetail($url)
    {
        try {
            $html = $this->fetchHtmlCached($url);


            Log::debug("HTML Response (first 500 chars): " . substr($html, 0, 500));

            $crawler = new Crawler($html);

            // 🔹 Lấy ảnh bìa — ưu tiên <img>, fallback background-image
            $coverPath = null;
            if ($crawler->filter('.col-image img')->count() > 0) {
                $coverPath = $crawler->filter('.col-image img')->attr('src');
            } elseif ($crawler->filter('.col-image')->count() > 0) {
                $style = $crawler->filter('.col-image')->attr('style');
                if (preg_match("/url\\(['\"]?(.*?)['\"]?\\)/", $style, $matches)) {
                    $coverPath = $matches[1];
                }
            }

            $coverUrl = $this->processCoverUrl($coverPath ?? '');
            return [
                'title' => $this->safeGetText($crawler, 'h1.title.title-detail a', 'Tiêu đề'),
                'slug' => Str::slug($this->safeGetText($crawler, 'h1.title.title-detail a', 'no-title')),
                'cover' => $coverUrl,

                'author' => $crawler->filter('.list-info .author p')->count()
                    ? trim($crawler->filter('.list-info .author p')->text())
                    : 'Đang cập nhật',

                'status' => $this->mapStatus(
                    $crawler->filter('.list-info .status p')->count()
                        ? trim($crawler->filter('.list-info .status p')->text())
                        : 'Đang tiến hành'
                ),

                'updated_at' => $crawler->filter('.list-info .update p')->count()
                    ? trim($crawler->filter('.list-info .update p')->text())
                    : null,

                'views' => $crawler->filter('.list-info .view p')->count()
                    ? trim($crawler->filter('.list-info .view p')->text())
                    : null,

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
            $html = $this->fetchHtmlCached($url);


            $crawler = new Crawler($html);
            $description = '';

            if ($crawler->filter('.sort-des .line-clamp')->count()) {
                $description = trim($crawler->filter('.sort-des .line-clamp')->text());
            }

            $description = $description ?: '';
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

    private function downloadAndSaveImage($imageUrl, $folder = 'covers')
    {
        $imageUrl = $this->cleanImageUrl($imageUrl);
        if (!$this->isValidImageUrl($imageUrl)) {
            Log::warning("URL ảnh không hợp lệ: {$imageUrl}");
            return null;
        }

        $tempPath = storage_path('app/temp_' . Str::uuid() . '.jpg');
        try {
            // Tải ảnh tạm
            $response = $this->client->get($imageUrl, ['sink' => $tempPath]);
            if ($response->getStatusCode() !== 200) {
                throw new \Exception("HTTP {$response->getStatusCode()}");
            }

            // Upload lên Cloudinary
            $cloudUrl = $this->uploadToCloudinary($tempPath, $folder);

            // Xóa file tạm
            if (file_exists($tempPath)) {
                @unlink($tempPath);
            }

            return $cloudUrl;
        } catch (\Exception $e) {
            Log::error("Tải hoặc upload ảnh thất bại: {$imageUrl} - " . $e->getMessage());
            if (file_exists($tempPath)) @unlink($tempPath);
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


    // private function isValidImageUrl($url)
    // {
    //     if (!filter_var($url, FILTER_VALIDATE_URL)) {
    //         return false;
    //     }

    //     $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    //     $extension = strtolower(pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION));
    //     $extension = preg_replace('/\?.*$/', '', $extension);

    //     if (in_array($extension, $allowedExtensions)) {
    //         return true;
    //     }

    //     try {
    //         $context = stream_context_create([
    //             'http' => [
    //                 'method'  => 'GET',
    //                 'timeout' => 15, // ⬆ tăng timeout để tránh timeout sớm
    //                 'header'  => "User-Agent: Mozilla/5.0\r\n",
    //                 'ignore_errors' => true, // ⬅ tránh die khi gặp 403
    //             ]
    //         ]);

    //         $stream = @fopen($url, 'r', false, $context);
    //         if ($stream) {
    //             $meta = stream_get_meta_data($stream);
    //             fclose($stream);

    //             if (!empty($meta['wrapper_data'])) {
    //                 foreach ($meta['wrapper_data'] as $header) {
    //                     if (stripos($header, 'Content-Type: image/') !== false) {
    //                         return true;
    //                     }
    //                 }
    //             }

    //             // Fallback: nếu không có header, thử get_headers
    //             $headers = @get_headers($url, 1);
    //             if ($headers && isset($headers['Content-Type'])) {
    //                 $contentType = is_array($headers['Content-Type'])
    //                     ? end($headers['Content-Type'])
    //                     : $headers['Content-Type'];

    //                 if (stripos($contentType, 'image/') !== false) {
    //                     return true;
    //                 }
    //             }

    //             // Không header nhưng vẫn mở được stream => vẫn coi là hợp lệ
    //             return true;
    //         }
    //     } catch (\Throwable $e) {
    //         Log::warning("Không thể tải thử ảnh: $url | {$e->getMessage()}");
    //     }

    //     return false;
    // }
    private function isValidImageUrl($url)
    {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        try {
            $response = $this->client->head($url);

            $status = $response->getStatusCode();
            if ($status >= 200 && $status < 300) {
                $contentType = $response->getHeaderLine('Content-Type');
                if (stripos($contentType, 'image/') !== false) {
                    return true;
                }
            }

            // Nếu HEAD bị chặn, fallback sang GET nhẹ (no body)
            $response = $this->client->request('GET', $url, ['stream' => true]);
            $contentType = $response->getHeaderLine('Content-Type');
            if (stripos($contentType, 'image/') !== false) {
                return true;
            }
        } catch (\Throwable $e) {
            // Web truyện hay chặn HEAD => bỏ lỗi luôn, coi như hợp lệ
            return true;
        }

        return false;
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
            if ($crawler->filter('.m-tags a')->count() === 0) {
                Log::warning("Không tìm thấy thể loại với selector '.m-tags a'");
                return [];
            }

            return $crawler->filter('.m-tags a')->each(function (Crawler $node) {
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

        $crawler->filter('.list-chapters .l-chapter')->each(function (Crawler $node) use (&$chapters, $comicId) {
            try {
                // Link chương
                $linkNode = $node->filter('a.ll-chap');

                if ($linkNode->count() === 0) {
                    Log::warning("Không tìm thấy thẻ a.ll-chap");
                    return;
                }

                // Lấy tên chương
                $chapterName = trim($linkNode->text());
                if (empty($chapterName)) {
                    Log::warning("Không tìm thấy tên chương");
                    return;
                }

                // Trích xuất số chương
                preg_match('/\d+(\.\d+)?/', $chapterName, $matches);
                $chapterNumber = $matches[0] ?? 0;

                // Kiểm tra chương đã tồn tại
                if (
                    $comicId && Chapters::where('comic_id', $comicId)
                    ->where('chapter_number', $chapterNumber)
                    ->exists()
                ) {
                    Log::info("Chapter {$chapterNumber} đã tồn tại, bỏ qua");
                    return;
                }

                // ✅ Lấy href từ thẻ <a> bên trong
                $href = trim($linkNode->attr('href') ?? '');
                if (empty($href)) {
                    Log::warning("Không tìm thấy href cho chapter {$chapterName}");
                    return;
                }

                // ✅ Chuẩn hóa URL
                $chapterUrl = str_starts_with($href, 'http')
                    ? $href
                    : rtrim($this->baseUrl, '/') . '/' . ltrim($href, '/');


                $viewCount = 0;

                // Ngày cập nhật: HTML không cung cấp, đặt mặc định là null
                $updatedAt = null; // Có thể thay bằng thời gian hiện tại: now()->toDateTimeString()

                // Data ID: HTML không cung cấp, đặt mặc định là null
                $dataId = null;

                $chapters[] = [
                    'name' => trim($chapterName),
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

            $html = $this->fetchHtmlCached($chapterUrl);
            // danh sách selector thử theo thứ tự (từ cụ thể -> bao quát)
            $selectors = [
                '#read-chaps .mi-item .i-right img.reading-img',
                '#read-chaps .mi-item img.reading-img',
                '#read-chaps img.reading-img',
                '.mi-item img.reading-img',
                'img.reading-img'
            ];
            $crawler = new Crawler($html);
            // ✅ Cập nhật selector phù hợp hơn (HangTruyen đổi layout thường xuyên)
            $imageNodes = $crawler->filter('img.reading-img, #read-chaps img.reading-img, .mi-item img.reading-img');


            if ($imageNodes->count() === 0) {
                Log::error("KHÔNG TÌM THẤY ẢNH - Kiểm tra selector '#read-chaps img.reading-img'");
                return [];
            }

            $pages = $imageNodes->each(function (Crawler $node, $i) {

                // Một số ảnh preload → src là /images/pre-load.png → cần dùng data-src
                $imageUrl = $node->attr('data-src') ?: $node->attr('src');


                if (!$imageUrl || str_contains($imageUrl, '/tracking/chapter')) {
                    Log::warning("Bỏ qua ảnh không hợp lệ hoặc tracking: {$imageUrl}");
                    return null;
                }

                // Chuẩn hóa URL
                $imageUrl = $this->cleanImageUrl($imageUrl);

                if (!$this->isValidImageUrl($imageUrl)) {
                    Log::warning("URL ảnh không hợp lệ: {$imageUrl}");
                    return null;
                }

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
            // Nếu chapter đã tồn tại thì bỏ qua toàn bộ
            if (Chapters::where('comic_id', $comic->id)
                ->where('chapter_number', $chapterData['number'])
                ->exists()
            ) {
                Log::info("Chapter {$chapterData['number']} đã tồn tại, bỏ qua.");
                continue;
            }

            Log::info("🔹 Bắt đầu xử lý chapter {$chapterData['number']}...");

            // Lưu chapter mới
            $chapter = Chapters::create([
                'comic_id' => $comic->id,
                'chapter_number' => $chapterData['number'],
                'title' => $chapterData['name'],
                'slug' => $chapterData['slug'],
                'status' => 1,
                'created_by' => 1,
                'updated_by' => 1,
            ]);

            // --- Giai đoạn tải ảnh song song ---
            $imageUrls = array_column($chapterData['pages'], 'image_url');
            $downloadedPaths = $this->downloadImagesAsync($imageUrls, 'pages', 10);

            // Gán vào bảng pages
            $pages = [];
            foreach ($chapterData['pages'] as $index => $pageData) {
                if (!empty($downloadedPaths[$index])) {
                    $pages[] = [
                        'page_number' => $pageData['page_number'],
                        'image_url' => $downloadedPaths[$index],
                        'status' => 1,
                        'created_by' => 1,
                        'updated_by' => 1,
                    ];
                }
            }

            if (!empty($pages)) {
                $chapter->pages()->createMany($pages);
                Log::info("✅ Chapter {$chapterData['number']} đã lưu thành công với " . count($pages) . " trang.");
            } else {
                Log::warning("⚠️ Không có trang nào được tải thành công cho chapter {$chapterData['number']}.");
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
