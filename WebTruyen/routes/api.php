<?php

use App\Http\Controllers\frontend\PageComicController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\backend\BookmarkController;
use App\Http\Controllers\backend\ChapterController;
use App\Http\Controllers\backend\ComicController;
use App\Http\Controllers\backend\GenreController;
use App\Http\Controllers\backend\PageController;
use App\Http\Controllers\backend\TeamController;
use App\Http\Controllers\backend\CommentController;
use App\Http\Controllers\backend\TeamMemberController;
use App\Http\Controllers\backend\UserController;
use App\Http\Controllers\backend\ContactController;
use App\Http\Controllers\backend\TeamJoinController;
use App\Http\Controllers\backend\StatsController;
use App\Http\Controllers\frontend\ComicDetailController;
use App\Http\Controllers\frontend\HomeController;
use App\Http\Controllers\frontend\SearchController;
use App\Http\Controllers\frontend\UserLogController;

Route::post('admin/login', [UserController::class, 'login']);

Route::group(["middleware" => ["auth:sanctum", "admin"]], function () {

    // Bookmark APIs
    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::get('/bookmarks/trash', [BookmarkController::class, 'trash']);
    Route::get('/bookmarks/show/{id}', [BookmarkController::class, 'show']);
    Route::post('/bookmarks/store', [BookmarkController::class, 'store']);
    Route::post('/bookmarks/update/{id}', [BookmarkController::class, 'update']);
    Route::post('/bookmarks/status/{id}', [BookmarkController::class, 'status']);
    Route::post('/bookmarks/delete/{id}', [BookmarkController::class, 'delete']);
    Route::post('/bookmarks/restore/{id}', [BookmarkController::class, 'restore']);
    Route::delete('/bookmarks/destroy/{id}', [BookmarkController::class, 'destroy']);


    // Chapter APIs
    Route::get('/chapters', [ChapterController::class, 'index']);
    Route::get('/chapters/filter', [ChapterController::class, 'filterChapters']);
    Route::get('/chapters/trash', [ChapterController::class, 'trash']);
    Route::get('/chapters/show/{id}', [ChapterController::class, 'show']);
    Route::post('/chapters/store', [ChapterController::class, 'store']);
    Route::post('/chapters/update/{id}', [ChapterController::class, 'update']);
    Route::post('/chapters/status/{id}', [ChapterController::class, 'status']);
    Route::post('/chapters/delete/{id}', [ChapterController::class, 'delete']);
    Route::post('/chapters/restore/{id}', [ChapterController::class, 'restore']);
    Route::delete('/chapters/destroy/{id}', [ChapterController::class, 'destroy']);

    // Comic APIs
    Route::get('/comics', [ComicController::class, 'index']);
    Route::get('/comics/trash', [ComicController::class, 'trash']);
    Route::get('/comics/show/{id}', [ComicController::class, 'show']);
    Route::post('/comics/store', [ComicController::class, 'store']);
    Route::post('/comics/update/{id}', [ComicController::class, 'update']);
    Route::post('/comics/status/{id}', [ComicController::class, 'status']);
    Route::post('/comics/delete/{id}', [ComicController::class, 'delete']);
    Route::post('/comics/restore/{id}', [ComicController::class, 'restore']);
    Route::delete('/comics/destroy/{id}', [ComicController::class, 'destroy']);

    // Genre APIs
    Route::get('/genres', [GenreController::class, 'index']);
    Route::get('/genres/trash', [GenreController::class, 'trash']);
    Route::get('/genres/show/{id}', [GenreController::class, 'show']);
    Route::post('/genres/store', [GenreController::class, 'store']);
    Route::post('/genres/update/{id}', [GenreController::class, 'update']);
    Route::post('/genres/status/{id}', [GenreController::class, 'status']);
    Route::post('/genres/delete/{id}', [GenreController::class, 'delete']);
    Route::post('/genres/restore/{id}', [GenreController::class, 'restore']);
    Route::delete('/genres/destroy/{id}', [GenreController::class, 'destroy']);

    // Page APIs
    Route::get('/pages', [PageController::class, 'index']);
    Route::get('/pages/trash', [PageController::class, 'trash']);
    Route::get('/pages/show/{id}', [PageController::class, 'show']);
    Route::post('/pages/store', [PageController::class, 'store']);
    Route::post('/pages/update/{id}', [PageController::class, 'update']);
    Route::post('/pages/status/{id}', [PageController::class, 'status']);
    Route::post('/pages/delete/{id}', [PageController::class, 'delete']);
    Route::post('/pages/restore/{id}', [PageController::class, 'restore']);
    Route::delete('/pages/destroy/{id}', [PageController::class, 'destroy']);

    // Team APIs
    Route::get('/teams', [TeamController::class, 'index']);
    Route::get('/teams/trash', [TeamController::class, 'trash']);
    Route::get('/teams/show/{id}', [TeamController::class, 'show']);
    Route::post('/teams/store', [TeamController::class, 'store']);
    Route::post('/teams/update/{id}', [TeamController::class, 'update']);
    Route::post('/teams/status/{id}', [TeamController::class, 'status']);
    Route::post('/teams/delete/{id}', [TeamController::class, 'delete']);
    Route::post('/teams/restore/{id}', [TeamController::class, 'restore']);
    Route::delete('/teams/destroy/{id}', [TeamController::class, 'destroy']);


    // TeamMember APIs
    Route::get('/teammembers', [TeamMemberController::class, 'index']);
    Route::get('/teammembers/trash', [TeamMemberController::class, 'trash']);
    Route::get('/teammembers/show/{id}', [TeamMemberController::class, 'show']);
    Route::post('/teammembers/store', [TeamMemberController::class, 'store']);
    Route::post('/teammembers/update/{id}', [TeamMemberController::class, 'update']);
    Route::post('/teammembers/status/{id}', [TeamMemberController::class, 'status']);
    Route::post('/teammembers/delete/{id}', [TeamMemberController::class, 'delete']);
    Route::post('/teammembers/restore/{id}', [TeamMemberController::class, 'restore']);
    Route::delete('/teammembers/destroy/{id}', [TeamMemberController::class, 'destroy']);

    // User APIs
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/trash', [UserController::class, 'trash']);
    Route::get('/users/show/{id}', [UserController::class, 'show']);
    Route::post('/users/store', [UserController::class, 'store']);
    Route::post('/users/update/{id}', [UserController::class, 'update']);
    Route::post('/users/status/{id}', [UserController::class, 'status']);
    Route::post('/users/delete/{id}', [UserController::class, 'delete']);
    Route::post('/users/restore/{id}', [UserController::class, 'restore']);
    Route::delete('/users/destroy/{id}', [UserController::class, 'destroy']);

    // Comment APIs
    Route::get('/comments', [CommentController::class, 'index']);
    Route::get('/comments/show/{id}', [CommentController::class, 'show']);
    Route::post('/comments/update/{id}', [CommentController::class, 'update']);
    Route::delete('/comments/destroy/{id}', [CommentController::class, 'delete']);

    // Contact APIs
    Route::get('/contacts', [ContactController::class, 'index']);
    Route::get('/contacts/trash', [ContactController::class, 'trash']);
    Route::get('/contacts/show/{id}', [ContactController::class, 'show']);
    Route::post('/contacts/store', [ContactController::class, 'store']);
    Route::post('/contacts/update/{id}', [ContactController::class, 'update']);
    Route::post('/contacts/status/{id}', [ContactController::class, 'status']);
    Route::post('/contacts/replay/{id}', [ContactController::class, 'replay']);
    Route::post('/contacts/delete/{id}', [ContactController::class, 'delete']);
    Route::post('/contacts/restore/{id}', [ContactController::class, 'restore']);
    Route::delete('/contacts/destroy/{id}', [ContactController::class, 'destroy']);

    // TeamJoin APIs
    Route::get('/teamjoins', [TeamJoinController::class, 'index']);
    Route::get('/teamjoins/trash', [TeamJoinController::class, 'trash']);
    Route::get('/teamjoins/show/{id}', [TeamJoinController::class, 'show']);
    Route::post('/teamjoins/status/{id}', [TeamJoinController::class, 'status']);
    Route::post('/teamjoins/approve/{id}', [TeamJoinController::class, 'approve']);
    Route::post('/teamjoins/replay/{id}', [TeamJoinController::class, 'replay']);
    Route::post('/teamjoins/delete/{id}', [TeamJoinController::class, 'delete']);
    Route::post('/teamjoins/restore/{id}', [TeamJoinController::class, 'restore']);
    Route::delete('/teamjoins/destroy/{id}', [TeamJoinController::class, 'destroy']);
});
Route::group(["middleware" => ["auth:sanctum", "adminteam"]], function () {
    Route::post('logout', [UserController::class, 'logout']);
    // User APIs
    Route::get('/users', [UserController::class, 'index']);

    Route::get('/dashboard', [StatsController::class, 'index']);

    // Chapter APIs
    Route::get('/chapters', [ChapterController::class, 'index']);
    Route::get('/chapters/trash', [ChapterController::class, 'trash']);
    Route::get('/chapters/show/{id}', [ChapterController::class, 'show']);
    Route::post('/chapters/store', [ChapterController::class, 'store']);
    Route::post('/chapters/update/{id}', [ChapterController::class, 'update']);
    Route::post('/chapters/status/{id}', [ChapterController::class, 'status']);
    Route::post('/chapters/delete/{id}', [ChapterController::class, 'delete']);
    Route::post('/chapters/restore/{id}', [ChapterController::class, 'restore']);

    // Comic APIs
    Route::get('/comics', [ComicController::class, 'index']);
    Route::get('/comics/trash', [ComicController::class, 'trash']);
    Route::get('/comics/show/{id}', [ComicController::class, 'show']);
    Route::post('/comics/store', [ComicController::class, 'store']);
    Route::post('/comics/update/{id}', [ComicController::class, 'update']);
    Route::post('/comics/status/{id}', [ComicController::class, 'status']);
    Route::post('/comics/delete/{id}', [ComicController::class, 'delete']);
    Route::post('/comics/restore/{id}', [ComicController::class, 'restore']);

    // Genre APIs
    Route::get('/genres', [GenreController::class, 'index']);

    // Page APIs
    Route::get('/pages', [PageController::class, 'index']);
    Route::get('/pages/trash', [PageController::class, 'trash']);
    Route::get('/pages/show/{id}', [PageController::class, 'show']);
    Route::post('/pages/store', [PageController::class, 'store']);
    Route::post('/pages/update/{id}', [PageController::class, 'update']);
    Route::post('/pages/status/{id}', [PageController::class, 'status']);
    Route::post('/pages/delete/{id}', [PageController::class, 'delete']);
    Route::post('/pages/restore/{id}', [PageController::class, 'restore']);


    // TeamMember APIs
    Route::get('/teammembers', [TeamMemberController::class, 'index']);
    Route::get('/teammembers/trash', [TeamMemberController::class, 'trash']);
    Route::get('/teammembers/show/{id}', [TeamMemberController::class, 'show']);
    Route::post('/teammembers/store', [TeamMemberController::class, 'store']);
    Route::post('/teammembers/update/{id}', [TeamMemberController::class, 'update']);
    Route::post('/teammembers/status/{id}', [TeamMemberController::class, 'status']);
    Route::post('/teammembers/delete/{id}', [TeamMemberController::class, 'delete']);
    Route::post('/teammembers/restore/{id}', [TeamMemberController::class, 'restore']);

    // Comment APIs
    Route::get('/comments', [CommentController::class, 'index']);
    Route::get('/comments/show/{id}', [CommentController::class, 'show']);


    // TeamJoin APIs
    Route::get('/teamjoins', [TeamJoinController::class, 'index']);
    Route::get('/teamjoins/trash', [TeamJoinController::class, 'trash']);
    Route::get('/teamjoins/show/{id}', [TeamJoinController::class, 'show']);
    Route::post('/teamjoins/status/{id}', [TeamJoinController::class, 'status']);
    Route::post('/teamjoins/approve/{id}', [TeamJoinController::class, 'approve']);
    Route::post('/teamjoins/replay/{id}', [TeamJoinController::class, 'replay']);
    Route::post('/teamjoins/delete/{id}', [TeamJoinController::class, 'delete']);
    Route::post('/teamjoins/restore/{id}', [TeamJoinController::class, 'restore']);
});

Route::get('/home', [HomeController::class, 'index']);
Route::get('/featured', [HomeController::class, 'getFeaturedComics']);
Route::get('/topviews', [HomeController::class, 'TopViews']);
Route::get('/search', [HomeController::class, 'search']);
Route::get('/listgenres', [HomeController::class, 'listgenres']);
Route::get('/genres/footer', [HomeController::class, 'listGenresFooter']);
Route::get('/comic/detail/{slug}', [ComicDetailController::class, 'comicDetail']);
Route::group(["middleware" => ["auth:sanctum"]], function () {
    Route::post('logout', [UserController::class, 'logout']);
    Route::get('/user/profile', [UserLogController::class, 'getUserProfile']);
    Route::get('/user/followed-comics', [UserLogController::class, 'getFollowedComics']);
    Route::get('/user/comments', [UserLogController::class, 'getUserComments']);

    Route::post('/updateProfile', [UserLogController::class, 'updateProfile']);
    Route::post('/updateAccount', [UserLogController::class, 'updateAccount']);

    Route::post('/bookmark/{comic_id}', [ComicDetailController::class, 'addBookmark']);
    Route::delete('/bookmark/{comic_id}', [ComicDetailController::class, 'removeBookmark']);
    Route::get('/bookmark', [ComicDetailController::class, 'listBookmarks']);
    Route::post('/comic/report-error', [PageComicController::class, 'reportComicError']);
    Route::post('/comments', [PageComicController::class, 'postComment']);
    Route::delete('/comments/{comment_id}', [PageComicController::class, 'deleteComment']);
    Route::post('/comments/{parent_id}/reply', [PageComicController::class, 'replyComment']);
    Route::post('/team/join', [SearchController::class, 'store']);
    Route::post('/team/request-create', [SearchController::class, 'requestTeamCreation']);
});
Route::get('/pagecomic/{chapter_id}/{comic_slug}', [PageComicController::class, 'getPagesByChapter']);
Route::get('comic/{comic_id}/comments', [PageComicController::class, 'getComicComments']);
Route::get('chapter/{chapter_id}/comments', [PageComicController::class, 'getChapterComments']);
Route::get('/chapter/{chapter_id}/comments', [PageComicController::class, 'getChapterComments']);


Route::post('/loginuser', [UserLogController::class, 'loginuser']);
Route::post('/customer_register', [UserLogController::class, 'customer_register']);
Route::post('/forgotPassword', [UserLogController::class, 'forgotPassword']);
Route::post('/resetPassword', [UserLogController::class, 'resetPassword']);
Route::post('/handleGoogleCallback', [UserLogController::class, 'handleGoogleCallback']);
Route::post('/comics/filter', [SearchController::class, 'filterComics']);
Route::get('/listteams', [SearchController::class, 'listTeams']);
Route::get('/team/{id}', [SearchController::class, 'listTeamById']);
Route::post('/chapter/increase-view', [PageComicController::class, 'increaseChapterView']);
