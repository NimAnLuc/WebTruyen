// src/components/Comments/CommentSection.tsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { apiService } from "../services/apiService.ts";

interface Comment {
  id: number;
  user_id: number;
  chapter_id: number;
  parent_id?: number | null;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  replies?: Comment[];
}

interface Comic {
  id: number;
  title: string;
  slug: string;
}

interface CommentSectionProps {
  chapter_id?: string;
  comic: Comic | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  chapter_id,
  comic,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Ảnh ${file.name} không hợp lệ!`);
        continue;
      }
      validFiles.push(file);
    }

    // ✅ Lưu file tạm và tạo URL preview
    setPendingFiles((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  // 🔹 Khi bấm Gửi
  const handlePostComment = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("Vui lòng đăng nhập trước khi bình luận!");
      return;
    }

    if (!newComment.trim() && pendingFiles.length === 0) {
      toast.warning("Vui lòng nhập nội dung hoặc chọn ảnh!");
      return;
    }

    setIsSubmitting(true);

    let finalContent = newComment.trim();

    // 🔹 Nếu có ảnh chờ upload → upload lần lượt lên Cloudinary
    if (pendingFiles.length > 0) {
      const cloudName = process.env.REACT_APP_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUD_PRESET || "uploadcomics";

      for (const file of pendingFiles) {
        const formDataCloud = new FormData();
        formDataCloud.append("file", file);
        formDataCloud.append("upload_preset", uploadPreset);
        formDataCloud.append("folder", "comments");

        try {
          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: formDataCloud }
          );
          const data = await res.json();
          if (data.secure_url) {
            finalContent += `<br/><img src="${data.secure_url}" alt="comment-image" />`;
          }
        } catch (err) {
          console.error(err);
          toast.error(`Lỗi khi upload ảnh ${file.name}`);
        }
      }
    }


       const res = (await apiService.postComment({
        comic_id: comic?.id!,
        chapter_id: Number(chapter_id),
        content: finalContent,
      })) as {
        status: boolean;
        message: string;
        comment: Comment;
      };

    toast.success("Đã gửi bình luận!");
    setNewComment("");
    setPendingFiles([]);
    setPreviewUrls([]);
    setComments((prev) => [res.comment, ...prev]);
    setIsSubmitting(false);
  };
  const fetchComments = async (pageNumber = 1) => {
    try {
      setIsLoadingPage(true);
      let res: any;

      if (chapter_id) {
        res = await apiService.getChapterComments(chapter_id, pageNumber);
      } else if (comic?.id) {
        res = await apiService.getComicComments(String(comic.id), pageNumber);
      } else return;

      setComments(res.comments || []);

      setPage(res.pagination.current_page);
      setLastPage(res.pagination.last_page);
    } catch (error: any) {
      toast.error(error.message || "Không thể tải bình luận!");
    } finally {
      setIsLoadingPage(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchComments(1);
  }, [chapter_id, comic?.id]);

  const handlePageChange = (p: number) => {
    if (p !== page) {
      fetchComments(p);
    }
  };

  // 🔹 Gửi bình luận
  // const handlePostComment = async () => {
  //   const token = localStorage.getItem("token");
  //   if (!token) {
  //     toast.warning("Vui lòng đăng nhập trước khi bình luận!");
  //     return;
  //   }

  //   if (!newComment.trim()) return toast.warning("Vui lòng nhập nội dung!");

  //   try {
  //     setIsSubmitting(true);
  //     const res = (await apiService.postComment({
  //       comic_id: comic?.id!,
  //       chapter_id: Number(chapter_id),
  //       content: newComment.trim(),
  //     })) as {
  //       status: boolean;
  //       message: string;
  //       comment: Comment;
  //     };
  //     setNewComment("");
  //     toast.success("Đã gửi bình luận!");
  //     setComments((prev) => [res.comment, ...prev]);
  //   } catch (error: any) {
  //     toast.error(error.message || "Không thể gửi bình luận!");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  // 🔹 Trả lời bình luận
  const handleReply = async (parent_id: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("Vui lòng đăng nhập trước khi trả lời!");
      return;
    }

    if (!replyContent.trim()) return toast.warning("Vui lòng nhập nội dung!");

    try {
      setIsSubmitting(true);
      const res = (await apiService.replyComment(
        parent_id,
        replyContent.trim()
      )) as {
        status: boolean;
        message: string;
        reply: Comment;
      };
      toast.success("Đã trả lời!");
      setReplyContent("");
      setReplyTo(null);
      // Cập nhật cây bình luận
      setComments((prev) =>
        prev.map((c) =>
          c.id === parent_id
            ? { ...c, replies: [...(c.replies || []), res.reply] }
            : c
        )
      );
    } catch (error: any) {
      toast.error(error.message || "Không thể trả lời bình luận!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Xóa bình luận
  const handleDeleteComment = async (comment_id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này không?")) return;

    try {
      await apiService.deleteComment(comment_id);
      toast.success("Đã xóa bình luận!");
      setComments((prev) => prev.filter((c) => c.id !== comment_id));
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa bình luận!");
    }
  };

  // 🔹 Đệ quy hiển thị comment
  const renderComments = (commentList: Comment[], level = 0) => {
    const storedUser = localStorage.getItem("user");
    const currentUserId = storedUser ? JSON.parse(storedUser).id : null;
    return commentList.map((comment) => (
      <div
        key={comment.id}
        className={`p-2 my-2 border-start border-${
          level === 0 ? "light" : "secondary"
        }`}
        style={{ marginLeft: level * 20 }}
      >
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex align-items-start">
            <img
              src={
                comment.user_avatar
                  ? `${comment.user_avatar}`
                  : "/images/logo.png"
              }
              alt="avatar"
              className="rounded-circle me-2"
              style={{ width: 50, height: 50, objectFit: "cover" }}
            />
            <div>
              <strong>{comment.user_name || "Người dùng"}</strong>
              <div className="text-muted small">
                {new Date(comment.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <button
              className="btn btn-sm btn-outline-info me-2"
              onClick={() =>
                setReplyTo(replyTo === comment.id ? null : comment.id)
              }
            >
              <i className="fas fa-reply"></i> Trả lời
            </button>

            {/* 🔹 Chỉ hiện nút xóa nếu là bình luận của chính mình */}
            {comment.user_id === currentUserId && (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDeleteComment(comment.id)}
              >
                <i className="fas fa-trash"></i>
              </button>
            )}
          </div>
        </div>

        <div
          className="mt-2 mb-1 comment-content"
          dangerouslySetInnerHTML={{ __html: comment.content }}
        ></div>

        {replyTo === comment.id && (
          <div className="mt-2">
            <textarea
              className="form-control bg-white text-dark"
              rows={2}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Nhập nội dung trả lời..."
            />
            <button
              className="btn btn-sm btn-primary mt-2"
              disabled={isSubmitting}
              onClick={() => handleReply(comment.id)}
            >
              Gửi trả lời
            </button>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="ms-3 mt-2">
            {renderComments(comment.replies, level + 1)}
          </div>
        )}
      </div>
    ));
  };
  const generatePagination = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 3;

    const addPages = (start: number, end: number) => {
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= lastPage) pages.push(i);
      }
    };

    // 3 trang đầu
    addPages(1, maxButtons);

    // Dãy giữa
    const startMid = page - 2;
    const endMid = page + 2;

    if (startMid > maxButtons + 1) pages.push("...");
    addPages(startMid, endMid);
    if (endMid < lastPage - maxButtons) pages.push("...");

    // 3 trang cuối
    addPages(lastPage - maxButtons + 1, lastPage);

    return Array.from(new Set(pages));
  };

  return (
    <section className="comments-section mt-5">
      <h4 className="text-warning mb-3">
        💬 Bình luận {chapter_id ? "chương" : "truyện"}
      </h4>

      {/* Form gửi bình luận */}
      <div className="mb-3">
        <textarea
          className="form-control bg-white text-dark"
          rows={3}
          placeholder="Nhập bình luận của bạn..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="mt-2 d-flex align-items-center">
          <label
            htmlFor="commentImage"
            className="btn btn-outline-secondary btn-sm me-2"
          >
            <i className="fas fa-image"></i> Thêm ảnh
          </label>
          <input
            type="file"
            id="commentImage"
            accept="image/*"
            multiple
            onChange={handleSelectImage}
            hidden
          />
        </div>

        {/* ✅ Hiển thị ảnh tạm */}
        {previewUrls.length > 0 && (
          <div className="mt-2 d-flex flex-wrap gap-2">
            {previewUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="preview"
                style={{ width: 100, borderRadius: 8, objectFit: "cover" }}
              />
            ))}
          </div>
        )}

        <button
          className="btn btn-primary mt-2"
          disabled={isSubmitting}
          onClick={handlePostComment}
        >
          Gửi bình luận
        </button>
      </div>

      {/* Danh sách bình luận */}
      {comments.length === 0 ? (
        <p className="text-dark p-4 rounded ms-4 bg-white">
          Chưa có bình luận nào.
        </p>
      ) : (
        <div className="comments-list ms-4 text-dark bg-white">
          {renderComments(comments)}
        </div>
      )}
      {lastPage > 1 && (
        <nav className="mt-3">
          <ul className="pagination justify-content-center">
            {generatePagination().map((p, index) =>
              typeof p === "string" ? (
                <li key={index} className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              ) : (
                <li
                  key={index}
                  className={`page-item ${page === p ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(p)}
                    disabled={isLoadingPage}
                  >
                    {p}
                  </button>
                </li>
              )
            )}
          </ul>
        </nav>
      )}
    </section>
  );
};

export default CommentSection;
