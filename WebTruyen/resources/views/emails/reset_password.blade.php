 <!DOCTYPE html>
     <html>
     <head>
         <title>Đặt lại mật khẩu</title>
     </head>
     <body>
         <h1>Xin chào {{ $user->name }},</h1>
         <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào liên kết dưới đây để đặt lại mật khẩu của bạn:</p>
         <p><a href="{{ $resetUrl }}">Đặt lại mật khẩu</a></p>
         <p>Liên kết này sẽ hết hạn sau 60 phút.</p>
         <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
         <p>Trân trọng,<br>{{ env('APP_NAME') }}</p>
     </body>
     </html>