import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Spinner,
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { apiService } from "../../../services/apiService.ts";
import TopViewComics from "../../../components/comic/TopComics.tsx";
import CommentSection from "../../../components/CommentSection.tsx";
import { Link } from "react-router-dom";

interface Chapter {
  id: number;
  chapter_number: number;
  slug: string;
  created_at: string;
  view_count: number;
}
interface Genre {
  id: number;
  name: string;
}

interface Comic {
  id: number;
  title: string;
  slug: string;
  cover_image: string;
  author_name: string;
  comic_status: string;
  genres: Genre[];
  views: number;
  bookmark_count: number;
  team_name?: string;
  description: string;
}

const ComicDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [comic, setComic] = useState<Comic | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // 🟢 Lấy thông tin truyện và kiểm tra bookmark
  useEffect(() => {
    const fetchComicDetail = async () => {
      try {
        const data = await apiService.comicDetail<any>(slug!);
        if (data.status) {
          setComic(data.comic);
          setChapters(data.chapters);

          // Kiểm tra bookmark (nếu đã đăng nhập)
          try {
            const bookmarkData = await apiService.getBookmarks<any>();
            const bookmarked = bookmarkData.bookmarks?.some(
              (b: any) => b.comic_id === data.comic.id
            );
            setIsBookmarked(bookmarked);
          } catch (err) {
            console.warn("Không thể kiểm tra bookmark:", err);
          }
        } else {
          console.error(data.message);
        }
      } catch (error) {
        toast.error("Không thể tải chi tiết truyện!");
      } finally {
        setLoading(false);
      }
    };
    fetchComicDetail();
  }, [slug]);
  // 🟢 Xử lý toggle bookmark
  const handleToggleBookmark = async () => {
    if (!comic) return;
    // 🔒 Kiểm tra token đăng nhập
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("Bạn cần đăng nhập để theo dõi truyện!");
      return;
    }
    try {
      if (isBookmarked) {
        // Đang theo dõi -> xoá bookmark
        const res = await apiService.removeBookmark<any>(comic.id);
        if (res.status) {
          setIsBookmarked(false);
          toast.info("Đã bỏ theo dõi truyện");
        } else {
          console.error(res.message);
        }
      } else {
        // Chưa theo dõi -> thêm bookmark
        const res = await apiService.addBookmark<any>(comic.id);
        if (res.status) {
          setIsBookmarked(true);
          toast.success("Đã thêm vào danh sách theo dõi");
        } else {
          console.error(res.message);
        }
      }
    } catch (error: any) {
      console.error(error.message || "Có lỗi khi cập nhật bookmark");
      toast.error("Lỗi khi cập nhật theo dõi!");
    }
  };
  // 🌀 Loading hiệu ứng đẹp với React Bootstrap
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <Spinner
          animation="border"
          variant="primary"
          role="status"
          className="me-2"
        />
        <span>Đang tải dữ liệu truyện...</span>
      </div>
    );
  }

  if (!comic) {
    return (
      <Container className="text-center mt-5">
        <p className="text-danger">Không tìm thấy truyện với slug: {slug}</p>
      </Container>
    );
  }

  return (
    <Container className="my-4 comic-detail">
      <Row className="g-4">
        {/* Cột chính (Thông tin truyện và danh sách chương) */}
        <Col lg={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Row>
                <Col md={3} xs={12} className="text-center mb-3 mb-md-0">
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "220px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "#f8f9fa",
                      margin: "0 auto",
                    }}
                  >
                    <img
                      src={
                        comic.cover_image
                          ? `${comic.cover_image}`
                          : "/images/logo.png"
                      }
                      alt={comic.title}
                      className="img-fluid w-100"
                      style={{
                        objectFit: "cover",
                        aspectRatio: "3/4",
                        display: "block",
                      }}
                    />
                  </div>
                </Col>

                <Col md={9}>
                  <h1 className="h3 fw-bold text-primary mb-3">
                    {comic.title}
                  </h1>

                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <strong className="me-2">👤 Tác giả:</strong>
                      <span>{comic.author_name || "Đang cập nhật"}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <strong className="me-2">📊 Trạng thái:</strong>
                      <span className="text-success">{comic.comic_status}</span>
                    </div>
                  </div>

                  {/* Thể loại */}
                  <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                    <strong>Thể loại:</strong>
                    {comic.genres && comic.genres.length > 0 ? (
                      comic.genres.map((genre) => (
                        <Link
                          key={genre.id}
                          to={`/comics/filter?genre=${genre.id}`}
                          className="badge bg-warning text-dark text-decoration-none"
                        >
                          {genre.name}
                        </Link>
                      ))
                    ) : (
                      <span className="text-muted ms-1">Chưa có</span>
                    )}
                  </div>

                  {/* Thống kê */}
                  <div className="d-flex gap-4 mb-3 text-center flex-wrap">
                    <div>
                      <div className="fw-bold fs-5">
                        {comic.views.toLocaleString()}
                      </div>
                      <div className="text-muted small">📖 Lượt xem</div>
                    </div>

                    <div>
                      <div className="fw-bold fs-5">
                        {comic.bookmark_count?.toLocaleString() || 0}
                      </div>
                      <div className="text-muted small">🔖 Theo dõi</div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (chapters.length > 0) {
                          // 👉 Lấy chapter cũ nhất
                          const firstChapter = chapters[chapters.length - 1];
                          window.location.href = `/comic/${comic.slug}/${firstChapter.slug}/${firstChapter.id}`;
                        } else {
                          toast.info("Truyện này chưa có chương nào.");
                        }
                      }}
                    >
                      Đọc từ đầu
                    </Button>
                    <Button
                      variant={isBookmarked ? "outline-danger" : "success"}
                      onClick={handleToggleBookmark}
                    >
                      {isBookmarked ? "❌ Bỏ theo dõi" : "👁️ Theo dõi"}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          {/* Mô tả */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">📋 TÓM TẮT NỘI DUNG</h5>
              <p className="text-muted" style={{ whiteSpace: "pre-line" }}>
                {showFullDescription
                  ? comic.description || "Chưa có mô tả cho truyện này."
                  : comic.description
                  ? comic.description.slice(0, 400) +
                    (comic.description.length > 400 ? "..." : "")
                  : "Chưa có mô tả cho truyện này."}
              </p>

              {comic.description && comic.description.length > 400 && (
                <div className="text-center">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                  >
                    {showFullDescription ? "Thu gọn" : "Xem thêm"}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Danh sách chương */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="fw-bold">📃 DANH SÁCH CHƯƠNG</Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Chương</th>
                    <th className="text-center">Cập nhật</th>
                    <th className="text-center">Lượt xem</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.length > 0 ? (
                    (showAllChapters ? chapters : chapters.slice(0, 15)).map(
                      (chapter) => (
                        <tr key={chapter.id}>
                          <td>
                            <a
                              href={`${comic.slug}/${chapter.slug}/${chapter.id}`}
                              className="text-decoration-none"
                            >
                              Chapter {chapter.chapter_number}
                            </a>
                          </td>
                          <td className="text-center">{chapter.created_at}</td>
                          <td className="text-center">{chapter.view_count}</td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td colSpan={2} className="text-center py-3 text-muted">
                        Chưa có chương nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Nút Xem thêm / Thu gọn */}
              {chapters.length > 15 && (
                <div className="text-center mt-3 mb-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowAllChapters(!showAllChapters)}
                  >
                    {showAllChapters ? "Thu gọn" : "Xem thêm"}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar bên phải */}
        <Col lg={4}>
          <TopViewComics />
        </Col>
        <CommentSection comic={comic} />
      </Row>
    </Container>
  );
};

export default ComicDetail;
