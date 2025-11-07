<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Support\Facades\Log;

class ImageUploadService
{
    protected $cloudinary;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => config('services.cloudinary.cloud_name'),
                'api_key'    => config('services.cloudinary.api_key'),
                'api_secret' => config('services.cloudinary.api_secret'),
            ],
        ]);
    }

    /**
     * Upload ảnh lên Cloudinary
     * @param \Illuminate\Http\UploadedFile $image
     * @param string $folder
     * @param string|null $fileName
     * @return string|null
     */
    public function upload($image, $folder = 'uploads', $fileName = null)
    {
        try {
            $options = [
                'folder' => $folder,
                'resource_type' => 'image',
                'format' => 'webp',
                'quality' => 'auto',
            ];

            if ($fileName) {
                $options['public_id'] = $fileName;
            }

            $upload = $this->cloudinary->uploadApi()->upload(
                $image->getRealPath(),
                $options
            );

            return $upload['secure_url'] ?? null;
        } catch (\Exception $e) {
            Log::error('❌ Lỗi upload ảnh Cloudinary: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Xóa ảnh khỏi Cloudinary (dựa vào URL)
     */
    public function delete($imageUrl, $folder = 'uploads')
    {
        try {
            if (!$imageUrl) return false;

            $path = parse_url($imageUrl, PHP_URL_PATH);
            $segments = explode('/', $path);
            $fileName = str_replace('.webp', '', end($segments));

            $this->cloudinary->uploadApi()->destroy("{$folder}/{$fileName}");

            return true;
        } catch (\Exception $e) {
            Log::warning('⚠️ Không thể xóa ảnh Cloudinary: ' . $e->getMessage());
            return false;
        }
    }
}
