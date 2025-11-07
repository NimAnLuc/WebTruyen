import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import Lottie from "lottie-react";
import animationData from "../../../components/Loading/animation.json";
import { apiService } from "../../../services/apiService.ts";
import { Modal, Button, Form } from "react-bootstrap";
import CommentSection from "../../../components/CommentSection.tsx";
import LazyImage from "../../../components/Loading/LazyImage.tsx";

interface Comic {
  id: number;
  title: string;
  slug: string;
  cover_image: string;
}

interface Page {
  id: number;
  chapter_id: number;
  page_number: number;
  image_url: string;
}

interface Chapter {
  id: number;
  chapter_number: number;
  slug: string;
  created_at: string;
}

interface ChapterResponse {
  status: boolean;
  message?: string;
  comic: Comic;
  pages: Page[];
  chapters: Chapter[];
}

const ComicReader: React.FC = () => {
  const { comic_slug, chapter_id } = useParams<{
    comic_slug: string;
    chapter_id: string;
  }>();
  const navigate = useNavigate();

  const [comic, setComic] = useState<Comic | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [chapterList, setChapterList] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [reportMessage, setReportMessage] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);

  useEffect(() => {
    const fetchChapterData = async () => {
      setIsLoading(true);
      try {
        const res = (await apiService.getPagesByChapterId(
          chapter_id!,
          comic_slug!
        )) as ChapterResponse;

        if (!res.status)
          throw new Error(res.message || "Không thể tải dữ liệu chương!");

        setComic(res.comic);
        setPages(res.pages || []);
        setLoadedImagesCount(0);
        setChapterList(res.chapters || []);

        const index = res.chapters.findIndex(
          (ch: Chapter) => ch.id === Number(chapter_id)
        );
        setCurrentIndex(index !== -1 ? index : 0);
        // 🔹 Lưu lịch sử đọc vào localStorage
        if (res.comic && chapter_id) {
          const currentChapter = res.chapters.find(
            (ch) => ch.id === Number(chapter_id)
          );

          const newEntry = {
            id: res.comic.id,
            title: res.comic.title,
            slug: res.comic.slug,
            cover_image: res.comic.cover_image || "/images/logo.png",
            latest_chapter_number: currentChapter?.chapter_number || 1,
            latest_chapter_slug: currentChapter?.slug || "",
            latest_chapter_id: currentChapter?.id || 0,
            last_read_at: new Date().toISOString(),
          };

          // Lấy lịch sử hiện có
          let history: any[] = JSON.parse(
            localStorage.getItem("readingHistory") || "[]"
          );

          // Xóa bản cũ nếu truyện này đã có
          history = history.filter((item) => item.id !== newEntry.id);

          // Thêm mới lên đầu
          history.unshift(newEntry);

          // Nếu vượt quá 50 thì xóa bản cũ nhất (ở cuối)
          if (history.length > 100) {
            history = history.slice(0, 100); // Giữ 50 bản đầu (mới nhất)
          }

          // Lưu lại
          localStorage.setItem("readingHistory", JSON.stringify(history));
        }
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi tải dữ liệu chương!");
      } finally {
        setIsLoading(false);
      }
    };

    if (chapter_id) fetchChapterData();
  }, [chapter_id, comic_slug]);
  useEffect(() => {

    if (pages.length > 0 && loadedImagesCount === pages.length) {

      apiService.increaseChapterView(Number(chapter_id)).catch(() => {
        console.warn("⚠️ Increase view failed");
      });
    }
  }, [loadedImagesCount, pages.length, chapter_id]);

  const handlePrevChapter = () => {
    if (currentIndex < chapterList.length - 1) {
      const prev = chapterList[currentIndex + 1];
      navigate(`/comic/${comic_slug}/${prev.slug}/${prev.id}`);
    } else {
      toast.info("Đây là chương đầu tiên!");
    }
  };

  const handleNextChapter = () => {
    if (currentIndex > 0) {
      const next = chapterList[currentIndex - 1];
      navigate(`/comic/${comic_slug}/${next.slug}/${next.id}`);
    } else {
      toast.info("Đây là chương mới nhất!");
    }
  };

  return (
    <main className="bg-dark text-white min-vh-100">
      <div className="reader-container container">
        {/* Header */}
        <div className="reading-header text-center mb-4">
          <div className="chapter-info fs-5 mb-2">
            {comic && (
              <Link
                to={`/comic/${comic.slug}`}
                className="text-decoration-none text-danger fw-bold"
              >
                {comic.title} -
              </Link>
            )}
            <span className="text-warning">
              {" "}
              Đang đọc chương{" "}
              {chapterList.find((ch) => ch.id === Number(chapter_id))
                ?.chapter_number ?? "?"}
            </span>
          </div>

          <div className="alert alert-info py-2">
            <i className="fa fa-info-circle"></i>{" "}
            <em>Sử dụng mũi tên ← → để chuyển chương</em>
          </div>

          <div className="reader-controls d-flex justify-content-center align-items-center gap-2 flex-wrap my-3">
            {/* Nút Báo lỗi */}
            <Button
              variant="outline-danger"
              onClick={() => setShowReportModal(true)}
              title="Báo cáo lỗi chương này"
            >
              <i className="fas fa-exclamation-circle me-2"></i>Báo lỗi
            </Button>

            {/* Nút fullscreen */}
            <button
              className="btn btn-outline-secondary"
              onClick={() => document.documentElement.requestFullscreen()}
              title="Toàn màn hình"
            >
              <i className="fas fa-expand"></i>
            </button>

            {/* Cụm điều hướng chương */}
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-primary" onClick={handlePrevChapter}>
                <i className="fas fa-arrow-left"></i>
              </button>

              <select
                className="form-select w-auto chapter-select"
                value={chapter_id}
                onChange={(e) => {
                  const selected = chapterList.find(
                    (ch) => ch.id === Number(e.target.value)
                  );
                  if (selected)
                    navigate(
                      `/comic/${comic_slug}/${selected.slug}/${selected.id}`
                    );
                }}
              >
                {chapterList.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Chapter {ch.chapter_number}
                  </option>
                ))}
              </select>

              <button className="btn btn-primary" onClick={handleNextChapter}>
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Nội dung truyện */}
        {isLoading ? (
          <div className="d-flex justify-content-center">
            <Lottie animationData={animationData} style={{ width: 150 }} />
          </div>
        ) : pages.length === 0 ? (
          <p className="text-center text-white">
            Chưa có trang nào trong chương này.
          </p>
        ) : (
          <div className="image-reader text-center">
            {pages.map((page) => (
              <LazyImage
                key={page.id}
                src={`${page.image_url}?v=${page.id}`}
                alt={`Trang ${page.page_number}`}
                className="reader-image img-fluid shadow"
                style={{ maxWidth: "900px" }}
                onLoad={() => setLoadedImagesCount((prev) => prev + 1)}
              />
            ))}
          </div>
        )}

        <div className="chapter-footer d-flex justify-content-center gap-3 my-4">
          <button className="btn btn-danger" onClick={handlePrevChapter}>
            <i className="fas fa-arrow-left mx-2"></i> Chap trước
          </button>
          <button className="btn btn-danger" onClick={handleNextChapter}>
            Chap sau <i className="fas fa-arrow-right mx-2"></i>
          </button>

          {/* 🔹 MODAL BÁO LỖI */}
          <Modal
            show={showReportModal}
            onHide={() => setShowReportModal(false)}
            centered
            backdrop="static"
            keyboard={false}
          >
            <Modal.Header
              closeButton
              className="bg-dark text-white border-secondary"
            >
              <Modal.Title className="text-danger">
                🚨 Báo lỗi chương
              </Modal.Title>
            </Modal.Header>

            <Modal.Body className="bg-dark text-white">
              <Form.Group className="mb-3">
                <Form.Label className="text-info">Loại lỗi gặp phải</Form.Label>
                <Form.Select
                  className="bg-secondary text-white"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                >
                  <option value="">-- Chọn loại lỗi --</option>
                  <option value="Thiếu trang">Thiếu trang</option>
                  <option value="Ảnh lỗi">Ảnh lỗi</option>
                  <option value="Trùng chương">Trùng chương</option>
                  <option value="Nội dung sai">Nội dung sai</option>
                  <option value="Lỗi khác">Lỗi khác</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="text-info">Mô tả chi tiết</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  className="bg-secondary text-white"
                  placeholder="Mô tả chi tiết lỗi..."
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                />
              </Form.Group>
            </Modal.Body>

            <Modal.Footer className="bg-dark border-secondary">
              <Button
                variant="secondary"
                onClick={() => setShowReportModal(false)}
              >
                Đóng
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  const token = localStorage.getItem("token");

                  if (!token) {
                    toast.warning("⚠️ Bạn cần đăng nhập để báo lỗi chương!");
                    return;
                  }

                  if (!reportTitle.trim()) {
                    toast.warning("Vui lòng chọn loại lỗi!");
                    return;
                  }

                  if (!reportMessage.trim()) {
                    toast.warning("Vui lòng nhập nội dung báo lỗi!");
                    return;
                  }

                  try {
                    const userData = JSON.parse(
                      localStorage.getItem("user") || "{}"
                    );
                    const name = userData?.name || "Người dùng ẩn danh";
                    const email = userData?.email || "no-reply@example.com";

                    await apiService.reportComicError({
                      name,
                      email,
                      phone: userData?.phone || "",
                      title: reportTitle,
                      content: `[${comic_slug} - Chương ${chapter_id}] ${reportMessage}`,
                    });

                    toast.success("🎉 Cảm ơn bạn đã báo lỗi! ❤️");
                    setReportMessage("");
                    setReportTitle("");
                    setShowReportModal(false);
                  } catch (error: any) {
                    toast.error(error.message || "Không thể gửi báo cáo lỗi!");
                  }
                }}
              >
                Gửi báo lỗi
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
        {/* Phần bình luận */}
        <CommentSection chapter_id={chapter_id!} comic={comic} />
      </div>
    </main>
  );
};

export default ComicReader;
