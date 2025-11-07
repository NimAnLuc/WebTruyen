   <?php

    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration
    {
        public function up()
        {
            Schema::create('team_join', function (Blueprint $table) {
                $table->id();
                $table->foreignId('team_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->enum('requested_role', ['leader', 'translator', 'proofreader', 'cleaner']);
                $table->unsignedBigInteger('approver_id')->nullable()->constrained('users')->onDelete('set null');
                $table->tinyInteger('status')->default(2); 
                $table->text('message')->nullable();
                $table->unsignedBigInteger('created_by');
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();

                // Ràng buộc unique để tránh yêu cầu trùng lặp cho cùng team và user
                $table->unique(['team_id', 'user_id']);
            });
        }

        public function down()
        {
            Schema::dropIfExists('team_join');
        }
    };
