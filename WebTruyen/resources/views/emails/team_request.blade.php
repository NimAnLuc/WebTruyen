<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Yêu cầu tạo nhóm dịch mới</title>
</head>
<body style="font-family: Arial, sans-serif; line-height:1.6;">
    <h2>📢 Yêu cầu tạo nhóm dịch mới</h2>

    <p><strong>Người gửi:</strong> {{ $user->name }} ({{ $user->email }})</p>
    <p><strong>Tên nhóm muốn tạo:</strong> {{ $teamName }}</p>

    @if(!empty($description))
        <p><strong>Mô tả nhóm:</strong><br> {{ $description }}</p>
    @endif

    <p><strong>Lý do tạo nhóm:</strong><br> {{ $reason }}</p>

    @if(!empty($logoPath))
        <p><strong>Logo nhóm:</strong></p>
        <img src="{{ $message->embed(Storage::disk('public')->path($logoPath)) }}"
             alt="Logo nhóm"
             style="max-width:200px; border:1px solid #ddd; border-radius:6px; padding:4px;">
    @endif

    <p><em>Thời gian gửi:</em> {{ now()->format('H:i d/m/Y') }}</p>

    <hr>
    <p style="font-size:13px; color:#888;">
        Email này được gửi tự động từ hệ thống web truyện.
    </p>
</body>
</html>
