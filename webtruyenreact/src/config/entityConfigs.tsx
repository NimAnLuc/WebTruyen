import { useEffect, useState } from "react";
import {
  EntityConfig,
  Comic,
  Bookmark,
  Comment,
  Chapter,
  Genre,
  Page,
  Team,
  TeamMember,
  User,
  Contact,
  TeamJoin,
} from "../types/index";
import {
  useFetchChapters,
  useFetchComics,
  useFetchComments,
  useFetchGenres,
  useFetchTeams,
  useFetchUsers,
  useFetchUsers1,
} from "./useFetch.tsx";
interface CommentFormConfigProps {
  currentCommentId?: number; // ID của comment hiện tại (trong chế độ chỉnh sửa)
}
// Hook cho Bookmark List Config (chỉ hiển thị id, user_id, comic_id, status)
export const useBookmarkListConfig = () => {
  const { users, loadingUsers, errorUsers } = useFetchUsers();
  const { comics, loadingComics, errorComics } = useFetchComics();

  const loading = loadingUsers || loadingComics;
  const error = errorUsers || errorComics;

  const bookmarkListConfig: EntityConfig<Bookmark> = {
    entityName: "Bookmark",
    endpoint: "bookmarks",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "user_id",
        label: "Người dùng",
        sortable: true,
        searchable: true,
        render: (value: number) =>
          users.find((u) => u.id === value)?.name ||
          "Không xác định hoặc đã bị xóa",
      },
      {
        key: "comic_id",
        label: "Truyện tranh",
        sortable: true,
        searchable: true,
        render: (value: number) =>
          comics.find((c) => c.id === value)?.title ||
          "Không xác định hoặc đã bị xóa",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({ 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" }[
            value
          ] || "Không xác định hoặc đã bị xóa"),
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["user_id", "comic_id"],
  };

  return { bookmarkListConfig, loading, error };
};
////có thể xem lại
// Hook cho Bookmark Show Config (hiển thị tất cả trường)
export const useBookmarkShowConfig = () => {
  const { users, loadingUsers, errorUsers } = useFetchUsers();
  const { comics, loadingComics, errorComics } = useFetchComics();

  const loading = loadingUsers || loadingComics;
  const error = errorUsers || errorComics;

  const bookmarkShowConfig: EntityConfig<Bookmark> = {
    entityName: "Bookmark",
    endpoint: "bookmarks",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "user_id",
        label: "Người dùng",
        sortable: true,
        searchable: true,
        render: (value: number) =>
          users.find((u) => u.id === value)?.name ||
          "Không xác định hoặc đã bị xóa",
      },
      {
        key: "comic_id",
        label: "Truyện tranh",
        sortable: true,
        searchable: true,
        render: (value: number) =>
          comics.find((c) => c.id === value)?.title ||
          "Không xác định hoặc đã bị xóa",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({ 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" }[
            value
          ] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "created_at",
        label: "Thời gian tạo",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_by",
        label: "Người tạo",
        sortable: true,
        render: (value: number) =>
          users.find((u) => u.id === value)?.name ||
          "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_at",
        label: "Thời gian cập nhật",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_by",
        label: "Người cập nhật",
        sortable: true,
        render: (value: number | null) =>
          value
            ? users.find((u) => u.id === value)?.name ||
              "Không xác định hoặc đã bị xóa"
            : "Không xác định hoặc đã bị xóa",
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["user_id", "comic_id"],
  };

  return { bookmarkShowConfig, loading, error };
};

// Hook cho Bookmark Form Config
export const useBookmarkFormConfig = () => {
  const { users, loadingUsers, errorUsers } = useFetchUsers();
  const { comics, loadingComics, errorComics } = useFetchComics();

  // Kết hợp trạng thái loading và error
  const loading = loadingUsers || loadingComics;
  const error = errorUsers || errorComics;

  const bookmarkFormConfig: EntityConfig<Bookmark> = {
    entityName: "Bookmark",
    endpoint: "bookmarks",
    fields: [
      {
        key: "user_id",
        label: "Người dùng",
        type: "select",
        options: users.map((u) => ({ value: u.id, label: u.name })),
        required: true,
      },
      {
        key: "comic_id",
        label: "Truyện tranh",
        type: "select",
        options: comics.map((c) => ({ value: c.id, label: c.title })),
        required: true,
      },
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        options: [
          { value: 0, label: "Không hoạt động" },
          { value: 1, label: "Hoạt động" },
          { value: 2, label: "Đang theo dõi" },
        ],
        required: true,
      },
    ],
  };

  return { bookmarkFormConfig, loading, error };
};
//có thể xem lại
export const useChapterListConfig = () => {
  const chapterListConfig: EntityConfig<Chapter> = {
    entityName: "Chapter",
    endpoint: "chapters",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "comic_title",
        label: "Tên truyện",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có tiêu đề",
      },
      {
        key: "chapter_number",
        label: "Số chương",
        sortable: true,
        render: (value: number | string) => {
          const numberValue =
            typeof value === "string" ? parseFloat(value) : value;
          return isNaN(numberValue)
            ? "Không xác định hoặc đã bị xóa"
            : numberValue.toFixed(1);
        },
      },
      {
        key: "title",
        label: "Tiêu đề",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có tiêu đề",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({ 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" }[
            value
          ] || "Không xác định hoặc đã bị xóa"),
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["comic_title", "title"],
  };

  return { chapterListConfig };
};
//có thể xem lại

export const useChapterShowConfig = () => {
  const chapterShowConfig: EntityConfig<Chapter> = {
    entityName: "Chapter",
    endpoint: "chapters",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "comic_id",
        label: "ID Truyện tranh",
        sortable: true,
        searchable: true,
      },
      {
        key: "comic_title",
        label: "Tên truyện",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có tiêu đề",
      },
      {
        key: "chapter_number",
        label: "Số chương",
        sortable: true,
        render: (value: number | string) => {
          const numberValue =
            typeof value === "string" ? parseFloat(value) : value;
          return isNaN(numberValue)
            ? "Không xác định hoặc đã bị xóa"
            : numberValue.toFixed(1);
        },
      },
      {
        key: "title",
        label: "Tiêu đề",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có tiêu đề",
      },

      {
        key: "slug",
        label: "Slug",
        sortable: true,
        searchable: true,
      },
      {
        key: "view_count",
        label: "Lượt xem",
        sortable: true,
        render: (value: number) => value.toString(),
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({ 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" }[
            value
          ] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "created_at",
        label: "Thời gian tạo",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_by",
        label: "ID Người tạo",
        sortable: true,
        render: (value: number) => value?.toString() || "Không xác định",
      },
      {
        key: "updated_at",
        label: "Thời gian cập nhật",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_by",
        label: "ID Người cập nhật",
        sortable: true,
        render: (value: number) => value?.toString() || "Không xác định",
      },
      {
        key: "creator_name",
        label: "Người tạo",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có thông tin",
      },
      {
        key: "updater_name",
        label: "Người cập nhật",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có thông tin",
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["comic_id", "title", "slug", "comic_title"],
  };

  return { chapterShowConfig };
};

// Hook cho Chapter Form Config
export const useChapterFormConfig = () => {
  const { comics, loadingComics, errorComics } = useFetchComics();

  // Kết hợp trạng thái loading và error
  const loading = loadingComics;
  const error = errorComics;

  const chapterFormConfig: EntityConfig<Chapter> = {
    entityName: "Chapter",
    endpoint: "chapters",
    fields: [
      {
        key: "comic_id",
        label: "Truyện tranh",
        type: "select",
        options: comics.map((c) => ({ value: c.id, label: c.title })),
        required: true,
      },
      {
        key: "chapter_number",
        label: "Số chương",
        type: "number",
        required: true,
      },
      {
        key: "title",
        label: "Tiêu đề",
        type: "text",
        required: false,
      },
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        options: [
          { value: 0, label: "Không hoạt động" },
          { value: 1, label: "Hoạt động" },
          { value: 2, label: "Đang theo dõi" },
        ],
        required: true,
      },
    ],
  };

  return { chapterFormConfig, loading, error };
};
export const useComicListConfig = () => {
  const comicListConfig: EntityConfig<Comic> = {
    entityName: "Comic",
    endpoint: "comics",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "title",
        label: "Tiêu đề",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có tiêu đề",
      },
      {
        key: "team_name",
        label: "Đội nhóm",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có đội nhóm",
      },
      {
        key: "cover_image",
        label: "Ảnh bìa",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value ? (
            <img src={value} alt="Cover" style={{ width: "50px" }} />
          ) : (
            "Không có ảnh"
          ),
      },
      {
        key: "views",
        label: "Lượt xem",
        sortable: true,
        searchable: true,
        render: (value: number | null) => value?.toString() || "0",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value] || "Không xác định hoặc đã bị xóa"),
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["title", "team_id", "description", "author_name"],
  };

  return { comicListConfig };
};
export const useComicShowConfig = () => {
  const comicShowConfig: EntityConfig<Comic> = {
    entityName: "Comic",
    endpoint: "comics",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "title",
        label: "Tiêu đề",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có tiêu đề",
      },
      {
        key: "description",
        label: "Mô tả",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "author_name",
        label: "Tên tác giả",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "team_id",
        label: "Id Đội nhóm",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có đội nhóm",
      },
      {
        key: "team_name",
        label: "Đội nhóm",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có đội nhóm",
      },
      {
        key: "comic_status",
        label: "Trạng thái truyện",
        sortable: true,
        render: (value: string | null) =>
          ({
            ongoing: "Đang tiến hành",
            completed: "Hoàn thành",
            hiatus: "Tạm dừng",
          }[value || ""] || "Không xác định hoặc đã bị xóa"),
      },

      {
        key: "cover_image",
        label: "Ảnh bìa",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value ? (
            <img src={value} alt="Cover" style={{ width: "100px" }} />
          ) : (
            "Không có ảnh"
          ),
      },
      {
        key: "slug",
        label: "Slug",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "views",
        label: "Lượt xem",
        sortable: true,
        render: (value: number | null) => value?.toString() || "0",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "genres",
        label: "Thể loại",
        sortable: true,
        searchable: true,
        render: (value: { id: number; name: string }[] | null) =>
          Array.isArray(value) && value.length > 0
            ? value.map((genre) => genre.name).join(", ")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_at",
        label: "Thời gian tạo",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_by",
        label: "ID Người tạo",
        sortable: true,
        render: (value: number) => value?.toString() || "Không xác định",
      },
      {
        key: "updated_at",
        label: "Thời gian cập nhật",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_by",
        label: "ID Người cập nhật",
        sortable: true,
        render: (value: number) => value?.toString() || "Không xác định",
      },
      {
        key: "creator_name",
        label: "Người tạo",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có thông tin",
      },
      {
        key: "updater_name",
        label: "Người cập nhật",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không có thông tin",
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["title", "slug", "team_id", "description", "author_name"],
  };

  return { comicShowConfig };
};

// Hook cho Comic Form Config
export const useComicFormConfig = () => {
  // Lấy thông tin user từ localStorage
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || null);
    }
  }, []);

  // Gọi useFetchTeams và useFetchGenres vô điều kiện
  const { teams, loadingTeams, errorTeams } = useFetchTeams();
  const { genres, loadingGenres, errorGenres } = useFetchGenres();

  const loading = loadingTeams || loadingGenres;
  const error = errorTeams || errorGenres;

  // Định nghĩa fields cơ bản
  const baseFields: Array<any> = [
    {
      key: "title",
      label: "Tiêu đề",
      type: "text",
      required: true,
      validate: (value: string) =>
        value.trim().length > 0 ? null : "Tiêu đề không được để trống",
    },
    {
      key: "description",
      label: "Mô tả",
      type: "text",
      required: false,
      validate: (value: string) =>
        value.trim().length <= 1000
          ? null
          : "Mô tả không được vượt quá 1000 ký tự",
    },
    {
      key: "author_name",
      label: "Tên tác giả",
      type: "text",
      required: false,
      validate: (value: string) =>
        value.trim().length === 0 || value.trim().length <= 100
          ? null
          : "Tên tác giả không được vượt quá 100 ký tự",
    },
    {
      key: "comic_status",
      label: "Trạng thái truyện",
      type: "select",
      options: [
        { value: "ongoing", label: "Đang tiến hành" },
        { value: "completed", label: "Hoàn thành" },
        { value: "hiatus", label: "Tạm dừng" },
      ],
      required: true,
      validate: (value: string) =>
        ["ongoing", "completed", "hiatus"].includes(value)
          ? null
          : "Trạng thái truyện không hợp lệ",
    },
    {
      key: "cover_image",
      label: "Ảnh bìa",
      type: "file",
      required: false,
      render: (value: File | string | undefined) => {
        if (typeof value === "string" && value) {
          return (
            <img
              src={value}
              alt="Cover"
              style={{ maxWidth: "100px", borderRadius: "4px" }}
            />
          );
        }
        return "Không có ảnh";
      },
      validate: (file: File | null) => {
        if (!file) return null;
        const maxSize = 2 * 1024 * 1024; // 2MB
        const validTypes = [
          "image/jpeg",
          "image/png",
          "image/jpg",
          "image/gif",
          "image/webp",
        ];
        if (!validTypes.includes(file.type)) {
          return "Định dạng ảnh không hợp lệ.";
        }
        if (file.size > maxSize) {
          return "Kích thước ảnh không được vượt quá 2MB.";
        }
        return null;
      },
    },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: 0, label: "Không hoạt động" },
        { value: 1, label: "Hoạt động" },
        { value: 2, label: "Đang theo dõi" },
      ],
      required: true,
      validate: (value: number) =>
        [0, 1, 2].includes(value) ? null : "Trạng thái không hợp lệ",
    },
    {
      key: "genre_ids",
      label: "Thể loại",
      type: "multi-select",
      options: genres.map((g) => ({ value: g.id, label: g.name })),
      required: false,
      validate: (value: number[] | undefined) => {
        if (!value || value.length === 0) return null;
        const invalidIds = value.filter(
          (id) => !genres.find((g) => g.id === id)
        );
        return invalidIds.length === 0
          ? null
          : "Một hoặc nhiều thể loại không hợp lệ";
      },
    },

    {
      key: "slug",
      label: "Slug",
      type: "text",
      required: false,
      validate: (value: string) =>
        value.trim().length === 0 || /^[a-z0-9-]+$/.test(value)
          ? null
          : "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
    },
  ];

  // Thêm trường team_id chỉ khi không phải role team
  const teamField =
    userRole === "team"
      ? [] // Không thêm trường team_id cho role team
      : [
          {
            key: "team_id",
            label: "Đội nhóm",
            type: "select",
            options: teams.map((t) => ({ value: t.id, label: t.name })),
            required: true,
            validate: (value: number) =>
              teams.find((t) => t.id === value)
                ? null
                : "Vui lòng chọn một đội nhóm hợp lệ",
          },
        ];

  const comicFormConfig: EntityConfig<Comic> = {
    entityName: "Comic",
    endpoint: "comics",
    fields: [...baseFields, ...teamField],
  };

  return { comicFormConfig, loading, error };
};

export const useCommentListConfig = () => {
  const commentListConfig: EntityConfig<Comment> = {
    entityName: "Comment",
    endpoint: "comments",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "comic_title",
        label: "Tên truyện",
        sortable: true,
        searchable: true,
      },
      {
        key: "chapter_title",
        label: "Số Chapter",
        sortable: true,
        searchable: true,
      },
      {
        key: "user_name",
        label: "Tên người dùng",
        sortable: true,
        searchable: true,
      },
    ],
    searchFields: ["chapter_title", "comic_title", "user_name"],
  };

  return { commentListConfig };
};

export const useCommentShowConfig = () => {
  const commentShowConfig: EntityConfig<Comment> = {
    entityName: "Comment",
    endpoint: "comments",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "comic_id",
        label: "Id truyện",
        sortable: true,
        searchable: true,
      },
      {
        key: "comic_title",
        label: "Tên truyện",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "chapter_id",
        label: "ID Chapter",
        sortable: true,
        searchable: true,
      },
      {
        key: "chapter_title",
        label: "Số Chapter",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "user_id",
        label: "ID người dùng",
        sortable: true,
        searchable: true,
      },

      {
        key: "user_name",
        label: "Tên người dùng",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "parent_id",
        label: "Tin nhắn cha",
        sortable: true,
        searchable: true,
        render: (value: string | null) => value || "Không xác định",
      },
      {
        key: "content",
        label: "Nôi dung",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_at",
        label: "Thời gian tạo",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_at",
        label: "Thời gian cập nhật",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
    ],
    searchFields: ["comic_id", "user_id", "chapter_id", "parent_id"],
  };

  return { commentShowConfig };
};

// Hook cho Comment Form Config
export const useCommentFormConfig = ({
  currentCommentId,
}: CommentFormConfigProps = {}) => {
  const { comments, loadingComments, errorComments } = useFetchComments();

  const loading = loadingComments;
  const error = errorComments;

  const commentFormConfig: EntityConfig<Comment> = {
    entityName: "Comment",
    endpoint: "comments",
    fields: [
      {
        key: "comic_id",
        label: "Truyện",
        type: "text",
        required: false,
        disabled: true,
      },
      {
        key: "chapter_id",
        label: "Số Chapter",
        type: "text",
        required: false,
        disabled: true,
      },
      {
        key: "parent_id",
        label: "Tin nhắn cha",
        type: "select",
        options: comments
          .filter((t) => t.id !== currentCommentId)
          .map((t) => ({
            value: t.id,
            label: t.id.toString(),
          })),
        required: false,
        validate: (value: number) =>
          !value || comments.find((t) => t.id === value)
            ? null
            : "Vui lòng chọn một comment hợp lệ",
      },
      {
        key: "content",
        label: "Nội dung",
        type: "text",
        required: true,
        validate: (value: string) =>
          value.trim().length > 0 ? null : "Nội dung không được để trống",
      },
    ],
  };

  return { commentFormConfig, loading, error };
};

export const useGenreListConfig = () => {
  const genreListConfig: EntityConfig<Genre> = {
    entityName: "Genre",
    endpoint: "genres",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "name",
        label: "Tên thể loại",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value] || "Không xác định hoặc đã bị xóa"),
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["name", "slug", "description"],
  };

  return { genreListConfig };
};

export const useGenreShowConfig = () => {
  const { users, loadingUsers, errorUsers } = useFetchUsers();

  const loading = loadingUsers;
  const error = errorUsers;

  const genreShowConfig: EntityConfig<Genre> = {
    entityName: "Genre",
    endpoint: "genres",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "name",
        label: "Tên thể loại",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "slug",
        label: "Slug",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "description",
        label: "Mô tả",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({ 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" }[
            value
          ] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "created_at",
        label: "Thời gian tạo",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_by",
        label: "Người tạo",
        sortable: true,
        render: (value: number) =>
          users.find((u) => u.id === value)?.name ||
          "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_at",
        label: "Thời gian cập nhật",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_by",
        label: "Người cập nhật",
        sortable: true,
        render: (value: number | null) =>
          value
            ? users.find((u) => u.id === value)?.name ||
              "Không xác định hoặc đã bị xóa"
            : "Không xác định hoặc đã bị xóa",
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["name", "slug", "description"],
  };

  return { genreShowConfig, loading, error };
};

export const useGenreFormConfig = () => {
  const genreFormConfig: EntityConfig<Genre> = {
    entityName: "Genre",
    endpoint: "genres",
    fields: [
      {
        key: "name",
        label: "Tên thể loại",
        type: "text",
        required: true,
        validate: (value: string) =>
          value.trim().length > 0 ? null : "Tên thể loại không được để trống",
      },
      {
        key: "slug",
        label: "Slug",
        type: "text",
        required: false,
        validate: (value: string) =>
          value.trim().length === 0 || /^[a-z0-9-]+$/.test(value)
            ? null
            : "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
      },
      {
        key: "description",
        label: "Mô tả",
        type: "text",
        required: false,
        validate: (value: string) =>
          value.trim().length <= 1000
            ? null
            : "Mô tả không được vượt quá 1000 ký tự",
      },
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        options: [
          { value: 0, label: "Không hoạt động" },
          { value: 1, label: "Hoạt động" },
          { value: 2, label: "Đang theo dõi" },
        ],
        required: true,
        validate: (value: number) =>
          [0, 1, 2].includes(value) ? null : "Trạng thái không hợp lệ",
      },
    ],
  };

  return { genreFormConfig };
};
////có thể xem lại
//có thể xem lại
export const usePageListConfig = () => {
  const { chapters, loadingChapters, errorChapters } = useFetchChapters();
  const { comics, loadingComics, errorComics } = useFetchComics();

  const loading = loadingChapters || loadingComics;
  const error = errorChapters || errorComics;

  const pageListConfig: EntityConfig<Page> = {
    entityName: "Page",
    endpoint: "pages",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "chapter_id",
        label: "Chương",
        sortable: true,
        searchable: true,
        render: (value: number) => {
          const chapter = chapters.find((c) => c.id === value);
          const comic = chapter
            ? comics.find((c) => c.id === chapter.comic_id)
            : null;
          return chapter && comic
            ? `${comic.title} - ${chapter.title}`
            : "Không xác định hoặc đã bị xóa";
        },
      },
      {
        key: "page_number",
        label: "Số trang",
        sortable: true,
        searchable: true,
        render: (value: number) => value.toString(),
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value] || "Không xác định hoặc đã bị xóa"),
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["chapter_id", "page_number"],
  };

  return { pageListConfig, loading, error };
};
////có thể xem lại
//có thể xem lại
export const usePageShowConfig = () => {
  const { chapters, loadingChapters, errorChapters } = useFetchChapters();
  const { comics, loadingComics, errorComics } = useFetchComics();

  const loading = loadingChapters || loadingComics;
  const error = errorChapters || errorComics;
  const pageShowConfig: EntityConfig<Page> = {
    entityName: "Page",
    endpoint: "pages",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "chapter_id",
        label: "Chương",
        sortable: true,
        searchable: true,
        render: (value: number) => {
          const chapter = chapters.find((c) => c.id === value);
          const comic = chapter
            ? comics.find((c) => c.id === chapter.comic_id)
            : null;
          return chapter && comic
            ? `${comic.title} - ${chapter.title}`
            : "Không xác định hoặc đã bị xóa";
        },
      },
      {
        key: "page_number",
        label: "Số trang",
        sortable: true,
        searchable: true,
        render: (value: number) => value.toString(),
      },
      {
        key: "image_url",
        label: "Ảnh trang",
        sortable: true,
        render: (value: File | string) =>
          typeof value === "string" && value ? (
            <img src={`${value}`} alt="Page" style={{ width: "100px" }} />
          ) : (
            "Không có ảnh"
          ),
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({ 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" }[
            value
          ] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "created_at",
        label: "Thời gian tạo",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_by",
        label: "ID Người tạo",
        sortable: true,
        render: (value: number) => value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "creator_name",
        label: "Người tạo",
        sortable: true,
      },
      {
        key: "updated_at",
        label: "Thời gian cập nhật",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_by",
        label: "ID Người cập nhật",
        sortable: true,
        render: (value: number) => value || "Không xác định hoặc đã bị xóa",
      },

      {
        key: "updater_name",
        label: "Người cập nhật",
        sortable: true,
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["chapter_id", "page_number"],
  };

  return { pageShowConfig, loading, error };
};

export const usePageFormConfig = (keyword: string) => {

  const pageFormConfig: EntityConfig<Page> = {
    entityName: "Page",
    endpoint: "pages",
    fields: [
      {
        key: "chapter_id",
        label: "Chương",
        type: "select",
        async: true,

        required: true,
      },

      {
        key: "page_number",
        label: "Số trang",
        type: "number",
        required: true,
        validate: (value: number) =>
          value > 0 ? null : "Số trang phải lớn hơn 0",
      },
      {
        key: "image_url",
        label: "Ảnh trang",
        type: "file",
        required: true,
        render: (value: File | string | undefined) => {
          if (typeof value === "string" && value) {
            return (
              <img
                src={value}
                alt="Page"
                style={{ maxWidth: "100px", borderRadius: "4px" }}
              />
            );
          }
          return "Không có ảnh";
        },
        validate: (file: File | null) => {
          if (!file) return "Vui lòng chọn một ảnh";
          const maxSize = 5 * 1024 * 1024; // 5MB
          const validTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/gif",
            "image/webp",
          ];
          if (!validTypes.includes(file.type)) {
            return "Định dạng ảnh không hợp lệ.";
          }
          if (file.size > maxSize) {
            return "Kích thước ảnh không được vượt quá 5MB.";
          }
          return null;
        },
      },
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        options: [
          { value: 0, label: "Không hoạt động" },
          { value: 1, label: "Hoạt động" },
          { value: 2, label: "Đang theo dõi" },
        ],
        required: true,
        validate: (value: number) =>
          [0, 1, 2].includes(value) ? null : "Trạng thái không hợp lệ",
      },
    ],
  };

  return { pageFormConfig };
};

export const useTeamListConfig = () => {
  const { users, loadingUsers, errorUsers } = useFetchUsers();

  const loading = loadingUsers;
  const error = errorUsers;

  const teamListConfig: EntityConfig<Team> = {
    entityName: "Team",
    endpoint: "teams",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "name",
        label: "Tên đội",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "logo",
        label: "Logo nhóm",
        sortable: true,
        render: (value: File | string) =>
          typeof value === "string" && value ? (
            <img src={`${value}`} alt="Page" style={{ width: "100px" }} />
          ) : (
            "Không có ảnh"
          ),
      },
      {
        key: "leader_id",
        label: "Trưởng nhóm",
        sortable: true,
        searchable: true,
        render: (value: number) =>
          users.find((u) => u.id === value)?.name ||
          "Không xác định hoặc đã bị xóa",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value] || "Không xác định hoặc đã bị xóa"),
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["name", "leader_id"],
  };

  return { teamListConfig, loading, error };
};

export const useTeamShowConfig = () => {
  const { users, loadingUsers, errorUsers } = useFetchUsers();

  const loading = loadingUsers;
  const error = errorUsers;

  const teamShowConfig: EntityConfig<Team> = {
    entityName: "Team",
    endpoint: "teams",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "name",
        label: "Tên đội",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "description",
        label: "Mô tả",
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "slug",
        label: "Slug",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "logo",
        label: "Logo nhóm",
        render: (value: string | null) =>
          value ? (
            <img src={`${value}`} alt="Team Logo" style={{ width: "100px" }} />
          ) : (
            "Không có ảnh"
          ),
      },
      {
        key: "leader_id",
        label: "Trưởng nhóm",
        sortable: true,
        searchable: true,
        render: (value: number) =>
          users.find((u) => u.id === value)?.name ||
          "Không xác định hoặc đã bị xóa",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({ 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" }[
            value
          ] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "created_by",
        label: "Người tạo",
        render: (value: number) =>
          users.find((u) => u.id === value)?.name ||
          "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_by",
        label: "Người cập nhật",
        render: (value: number | null) =>
          value
            ? users.find((u) => u.id === value)?.name ||
              "Không xác định hoặc đã bị xóa"
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_at",
        label: "Thời gian tạo",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_at",
        label: "Thời gian cập nhật",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["name", "leader_id", "slug"],
  };

  return { teamShowConfig, loading, error };
};
export const useTeamFormConfig = () => {
  const { users, loadingUsers, errorUsers } = useFetchUsers();

  const loading = loadingUsers;
  const error = errorUsers;

  const teamFormConfig: EntityConfig<Team> = {
    entityName: "Team",
    endpoint: "teams",
    fields: [
      {
        key: "name",
        label: "Tên đội",
        type: "text",
        required: true,
        validate: (value: string) =>
          value.trim().length > 0 ? null : "Tên đội không được để trống",
      },
      {
        key: "description",
        label: "Mô tả",
        type: "text",
        required: false,
        validate: (value: string) =>
          value.trim().length <= 1000
            ? null
            : "Mô tả không được vượt quá 1000 ký tự",
      },
      {
        key: "slug",
        label: "Slug",
        type: "text",
        required: false,
        validate: (value: string) =>
          value.trim().length === 0 || /^[a-z0-9-]+$/.test(value)
            ? null
            : "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
      },
      {
        key: "logo",
        label: "Logo",
        type: "file",
        required: false,
        render: (value: File | string | undefined) => {
          if (typeof value === "string" && value) {
            return (
              <img
                src={`${value}`}
                alt="Team Logo"
                style={{ maxWidth: "100px", borderRadius: "4px" }}
              />
            );
          }
          return "Không có ảnh";
        },
        validate: (file: File | null) => {
          if (!file) return null;
          const maxSize = 2 * 1024 * 1024; // 2MB
          const validTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/gif",
            "image/webp",
          ];
          if (!validTypes.includes(file.type)) {
            return "Định dạng ảnh không hợp lệ.";
          }
          if (file.size > maxSize) {
            return "Kích thước ảnh không được vượt quá 2MB.";
          }
          return null;
        },
      },
      {
        key: "leader_id",
        label: "Trưởng nhóm",
        type: "select",
        options: users.map((u) => ({ value: u.id, label: u.name })),
        required: true,
        validate: (value: number) =>
          users.find((u) => u.id === value)
            ? null
            : "Vui lòng chọn một trưởng nhóm hợp lệ",
      },
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        options: [
          { value: 0, label: "Không hoạt động" },
          { value: 1, label: "Hoạt động" },
          { value: 2, label: "Đang theo dõi" },
        ],
        required: true,
        validate: (value: number) =>
          [0, 1, 2].includes(value) ? null : "Trạng thái không hợp lệ",
      },
    ],
  };

  return { teamFormConfig, loading, error };
};

export const useTeamMemberListConfig = () => {
  const teamMemberListConfig: EntityConfig<TeamMember> = {
    entityName: "TeamMember",
    endpoint: "teammembers",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "team_name",
        label: "Đội nhóm",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "username",
        label: "Thành viên",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "role",
        label: "Vai trò",
        sortable: true,
        render: (value: "leader" | "translator" | "proofreader" | "cleaner") =>
          ({
            leader: "Trưởng nhóm",
            translator: "Dịch giả",
            proofreader: "Biên tập",
            cleaner: "Người xử lý ảnh",
          }[value] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value] || "Không xác định hoặc đã bị xóa"),
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["team_name", "username"],
  };

  return { teamMemberListConfig };
};
export const useTeamMemberShowConfig = () => {
  const teamMemberShowConfig: EntityConfig<TeamMember> = {
    entityName: "TeamMember",
    endpoint: "teammembers",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "team_name",
        label: "Đội nhóm",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "username",
        label: "Thành viên",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "role",
        label: "Vai trò",
        sortable: true,
        render: (value: "leader" | "translator" | "proofreader" | "cleaner") =>
          ({
            leader: "Trưởng nhóm",
            translator: "Dịch giả",
            proofreader: "Biên tập",
            cleaner: "Người xử lý ảnh",
          }[value] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number) =>
          ({ 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" }[
            value
          ] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "created_by",
        label: "Người tạo",
        render: (value: number) => value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_by",
        label: "Người cập nhật",
        render: (value: number | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "creator_name",
        label: "Người tạo",
        render: (value: number) => value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updater_name",
        label: "Người cập nhật",
        render: (value: number | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_at",
        label: "Thời gian tạo",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_at",
        label: "Thời gian cập nhật",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["team_id", "user_id"],
  };

  return { teamMemberShowConfig };
};
// Hook cho TeamMember Form Config
export const useTeamMemberFormConfig = (teamId?: number) => {
  const { users, loadingUsers, errorUsers } = useFetchUsers1(teamId); // Truyền teamId nếu cần
  const { teams, loadingTeams, errorTeams } = useFetchTeams();

  // Lấy thông tin user từ localStorage
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || null);
    }
  }, []);

  const loading = loadingUsers || loadingTeams;
  const error = errorUsers || errorTeams;

  // Định nghĩa fields cơ bản
  const baseFields: Array<any> = [
    {
      key: "user_id",
      label: "Thành viên",
      type: "select",
      options: users.map((u) => ({ value: u.id, label: u.name })),
      required: true,
      validate: (value: number) =>
        users.find((u) => u.id === value)
          ? null
          : "Vui lòng chọn một thành viên hợp lệ",
    },
    {
      key: "role",
      label: "Vai trò",
      type: "select",
      options: [
        { value: "leader", label: "Trưởng nhóm" },
        { value: "translator", label: "Dịch giả" },
        { value: "proofreader", label: "Biên tập" },
        { value: "cleaner", label: "Người xử lý ảnh" },
      ],
      required: true,
      validate: (value: string) =>
        ["leader", "translator", "proofreader", "cleaner"].includes(value)
          ? null
          : "Vui lòng chọn một vai trò hợp lệ",
    },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: 0, label: "Không hoạt động" },
        { value: 1, label: "Hoạt động" },
        { value: 2, label: "Đang theo dõi" },
      ],
      required: true,
      validate: (value: number) =>
        [0, 1, 2].includes(value) ? null : "Trạng thái không hợp lệ",
    },
  ];

  // Thêm trường team_id chỉ khi không phải role team
  const teamField =
    userRole === "team"
      ? [] // Không thêm trường team_id cho role team
      : [
          {
            key: "team_id",
            label: "Đội nhóm",
            type: "select",
            options: teams.map((t) => ({ value: t.id, label: t.name })),
            required: true,
            validate: (value: number) =>
              teams.find((t) => t.id === value)
                ? null
                : "Vui lòng chọn một đội nhóm hợp lệ",
          },
        ];

  const teamMemberFormConfig: EntityConfig<TeamMember> = {
    entityName: "TeamMember",
    endpoint: "teammembers",
    fields: [...baseFields, ...teamField],
  };

  return { teamMemberFormConfig, loading, error };
};
export const useUserListConfig = () => {
  const userListConfig: EntityConfig<User> = {
    entityName: "User",
    endpoint: "users",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "name",
        label: "Tên",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "role",
        label: "Vai trò",
        sortable: true,
        render: (value: "admin" | "team" | "user") =>
          ({
            admin: "Quản trị viên",
            team: "Nhóm dịch",
            user: "Người dùng",
          }[value] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "image_url",
        label: "Ảnh đại diện",
        sortable: true,
        render: (value: string | null) =>
          value ? (
            <img
              src={`${value}`}
              alt="Avatar"
              style={{ width: "50px", borderRadius: "4px" }}
            />
          ) : (
            "Không có ảnh"
          ),
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number | undefined) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value || 0] || "Không xác định hoặc đã bị xóa"),
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["name", "email"],
  };

  return { userListConfig };
};
export const useUserShowConfig = () => {
  const { users, loadingUsers, errorUsers } = useFetchUsers();

  const loading = loadingUsers;
  const error = errorUsers;

  const userShowConfig: EntityConfig<User> = {
    entityName: "User",
    endpoint: "users",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "name",
        label: "Tên",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "role",
        label: "Vai trò",
        sortable: true,
        render: (value: "admin" | "team" | "user") =>
          ({
            admin: "Trưởng nhóm",
            team: "Nhóm dịch",
            user: "Người dùng",
          }[value] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "image_url",
        label: "Ảnh đại diện",
        sortable: true,
        render: (value: string | null) =>
          value ? (
            <img
              src={`${value}`}
              alt="Avatar"
              style={{ width: "100px", borderRadius: "4px" }}
            />
          ) : (
            "Không có ảnh"
          ),
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number | undefined) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value || 0] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "email_verified_at",
        label: "Thời gian xác thực email",
        sortable: true,
        render: (value: string | null) =>
          value ? new Date(value).toLocaleString("vi-VN") : "Chưa xác thực",
      },
      {
        key: "created_by",
        label: "Người tạo",
        render: (value: number | undefined) =>
          users.find((u) => u.id === value)?.name ||
          "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_by",
        label: "Người cập nhật",
        render: (value: number | null | undefined) =>
          value
            ? users.find((u) => u.id === value)?.name ||
              "Không xác định hoặc đã bị xóa"
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_at",
        label: "Thời gian tạo",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_at",
        label: "Thời gian cập nhật",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["name", "email"],
  };

  return { userShowConfig, loading, error };
};
export const useUserFormConfig = () => {
  const userFormConfig: EntityConfig<User> = {
    entityName: "User",
    endpoint: "users",
    fields: [
      {
        key: "name",
        label: "Tên",
        type: "text",
        required: true,
        validate: (value: string) =>
          value.trim().length > 0 ? null : "Tên không được để trống",
      },
      {
        key: "email",
        label: "Email",
        type: "text",
        required: true,
        validate: (value: string) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? null
            : "Email không hợp lệ",
      },
      {
        key: "password",
        label: "Mật khẩu",
        type: "password",
        required: (formData: Partial<User>) => !formData.id,
        validate: (value: string, formData: Partial<User>) => {
          if (!formData.id && !value) return "Mật khẩu không được để trống";
          if (value && value.length < 6)
            return "Mật khẩu phải có ít nhất 6 ký tự";
          return null;
        },
      },
      {
        key: "role",
        label: "Vai trò",
        type: "select",
        options: [
          { value: "admin", label: "Quản trị viên" },
          { value: "user", label: "Người dùng" },
          { value: "team", label: "Nhóm" },
        ],
        required: true,
        validate: (value: string | undefined) =>
          ["admin", "user", "team"].includes(value || "")
            ? null
            : "Vui lòng chọn một vai trò hợp lệ",
      },
      {
        key: "image_url",
        label: "Ảnh đại diện",
        type: "file",
        required: false,
        render: (value: File | string | undefined) => {
          if (typeof value === "string" && value) {
            return (
              <img
                src={`${value}`}
                alt="Avatar"
                style={{ maxWidth: "100px", borderRadius: "4px" }}
              />
            );
          }
          return "Không có ảnh";
        },
        validate: (file: File | null) => {
          if (!file) return null;
          const maxSize = 2 * 1024 * 1024; // 2MB
          const validTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/gif",
            "image/webp",
          ];
          if (!validTypes.includes(file.type)) {
            return "Định dạng ảnh không hợp lệ.";
          }
          if (file.size > maxSize) {
            return "Kích thước ảnh không được vượt quá 2MB.";
          }
          return null;
        },
      },
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        options: [
          { value: 0, label: "Không hoạt động" },
          { value: 1, label: "Hoạt động" },
          { value: 2, label: "Đang theo dõi" },
        ],
        required: true,
        validate: (value: number | undefined) =>
          [0, 1, 2].includes(value || -1) ? null : "Trạng thái không hợp lệ",
      },
    ],
  };

  return { userFormConfig };
};
export const useContactListConfig = () => {
  const contactListConfig: EntityConfig<Contact> = {
    entityName: "Contact",
    endpoint: "contacts",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "name",
        label: "Tên",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "title",
        label: "Tiêu đề",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "replay_id",
        label: "Trạng thái trả lời",
        sortable: true,
        render: (value: number | null | undefined) =>
          value ? "Đã trả lời" : "Chưa trả lời",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number | undefined) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value || 0] || "Không xác định hoặc đã bị xóa"),
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["name", "title"],
  };

  return { contactListConfig };
};
export const useContactShowConfig = () => {
  const { users, loadingUsers, errorUsers } = useFetchUsers();

  const loading = loadingUsers;
  const error = errorUsers;

  const contactShowConfig: EntityConfig<Contact> = {
    entityName: "Contact",
    endpoint: "contacts",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "name",
        label: "Tên",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "phone",
        label: "Số điện thoại",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "title",
        label: "Tiêu đề",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "content",
        label: "Nội dung",
        sortable: false,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "replay_id",
        label: "Tên người Phản hồi",
        render: (value: number | null | undefined) =>
          value
            ? users.find((c) => c.id === value)?.name ||
              "Không xác định hoặc đã bị xóa"
            : "Không có",
      },
      {
        key: "user_id",
        label: "ID Người dùng",
        render: (value: number | null | undefined) =>
          value
            ? users.find((u) => u.id === value)?.name ||
              "Không xác định hoặc đã bị xóa"
            : "Không có",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number | undefined) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value || 0] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "updated_by",
        label: "Người cập nhật",
        render: (value: number | null | undefined) =>
          value
            ? users.find((u) => u.id === value)?.name ||
              "Không xác định hoặc đã bị xóa"
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_at",
        label: "Thời gian tạo",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_at",
        label: "Thời gian cập nhật",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["name", "email", "phone", "title"],
  };

  return { contactShowConfig, loading, error };
};

export const useContactFormConfig = () => {
  const { users, loadingUsers, errorUsers } = useFetchUsers();

  const loading = loadingUsers;
  const error = errorUsers;

  const contactFormConfig: EntityConfig<Contact> = {
    entityName: "Contact",
    endpoint: "contacts",
    fields: [
      {
        key: "name",
        label: "Tên",
        type: "text",
        required: true,
        validate: (value: string) =>
          value.trim().length > 0 ? null : "Tên không được để trống",
      },
      {
        key: "email",
        label: "Email",
        type: "text",
        required: true,
        validate: (value: string) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? null
            : "Email không hợp lệ",
      },
      {
        key: "phone",
        label: "Số điện thoại",
        type: "text",
        required: true,
        validate: (value: string) =>
          value.trim().length > 0 ? null : "Số điện thoại không được để trống",
      },
      {
        key: "title",
        label: "Tiêu đề",
        type: "text",
        required: true,
        validate: (value: string) =>
          value.trim().length > 0 ? null : "Tiêu đề không được để trống",
      },
      {
        key: "content",
        label: "Nội dung",
        type: "textarea",
        required: true,
        validate: (value: string) =>
          value.trim().length > 0 ? null : "Nội dung không được để trống",
      },
      {
        key: "user_id",
        label: "ID Người dùng",
        type: "select",
        options: users.map((u) => ({
          value: u.id,
          label: u.name || `ID: ${u.id}`,
        })),
        required: false,
        validate: (value: number | undefined) =>
          value === undefined || users.some((u) => u.id === value)
            ? null
            : "ID Người dùng không hợp lệ",
      },
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        options: [
          { value: 0, label: "Không hoạt động" },
          { value: 1, label: "Hoạt động" },
          { value: 2, label: "Đang theo dõi" },
        ],
        required: true,
        validate: (value: number | undefined) =>
          [0, 1, 2].includes(value || -1) ? null : "Trạng thái không hợp lệ",
      },
    ],
  };

  return { contactFormConfig, loading, error };
};

export const useTeamJoinListConfig = () => {
  const teamJoinListConfig: EntityConfig<TeamJoin> = {
    entityName: "TeamJoin",
    endpoint: "teamjoins",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },
      {
        key: "team_name",
        label: "Đội nhóm",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "username",
        label: "Tên người dùng",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "requested_role",
        label: "Vai trò yêu cầu",
        sortable: true,
        searchable: true,
        render: (value: string | undefined) =>
          ({
            leader: "Trưởng nhóm",
            translator: "Dịch giả",
            proofreader: "Biên tập",
            cleaner: "Người xử lý ảnh",
          }[value || ""] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number | undefined) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value || 0] || "Không xác định hoặc đã bị xóa"),
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["team_id", "user_id", "requested_role"],
  };

  return { teamJoinListConfig };
};

export const useTeamJoinShowConfig = () => {
  const teamJoinShowConfig: EntityConfig<TeamJoin> = {
    entityName: "TeamJoin",
    endpoint: "teamjoins",
    fields: [
      {
        key: "id",
        label: "ID",
        sortable: true,
      },

      {
        key: "team_id",
        label: "Id đội nhóm",
        sortable: true,
        searchable: true,
        render: (value: number) => value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "team_name",
        label: "Đội nhóm",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "user_id",
        label: "ID Người yêu cầu",
        sortable: true,
        searchable: true,
        render: (value: number) => value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "username",
        label: "Người yêu cầu",
        sortable: true,
        searchable: true,
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "requested_role",
        label: "Vai trò yêu cầu",
        sortable: true,
        searchable: true,
        render: (value: string | undefined) =>
          ({
            leader: "Trưởng nhóm",
            translator: "Dịch giả",
            proofreader: "Biên tập",
            cleaner: "Người xử lý ảnh",
          }[value || ""] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "approver_id",
        label: "ID Người duyệt",
        render: (value: number | null | undefined) =>
          value ? value || "Không xác định hoặc đã bị xóa" : "Chưa có",
      },
      {
        key: "approver_name",
        label: "Người duyệt",
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "message",
        label: "Tin nhắn",
        sortable: false,
        render: (value: string | null) => value || "Không có",
      },
      {
        key: "status",
        label: "Trạng thái",
        sortable: true,
        render: (value: number | undefined) =>
          ({
            0: "Không hoạt động",
            1: "Hoạt động",
            2: "Đang theo dõi",
          }[value || 0] || "Không xác định hoặc đã bị xóa"),
      },
      {
        key: "created_by",
        label: "ID Người tạo",
        render: (value: number | null | undefined) =>
          value
            ? value || "Không xác định hoặc đã bị xóa"
            : "Không xác định hoặc đã bị xóa",
      },

      {
        key: "creator_name",
        label: "Người tạo",
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_by",
        label: "ID Người cập nhật",
        render: (value: number | null | undefined) =>
          value
            ? value || "Không xác định hoặc đã bị xóa"
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updater_name",
        label: "Người cập nhật",
        render: (value: string | null) =>
          value || "Không xác định hoặc đã bị xóa",
      },
      {
        key: "created_at",
        label: "Thời gian tạo",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
      {
        key: "updated_at",
        label: "Thời gian cập nhật",
        sortable: true,
        render: (value: string | null) =>
          value
            ? new Date(value).toLocaleString("vi-VN")
            : "Không xác định hoặc đã bị xóa",
      },
    ],
    statusField: "status",
    statusLabels: { 0: "Không hoạt động", 1: "Hoạt động", 2: "Đang theo dõi" },
    searchFields: ["team_id", "user_id", "requested_role"],
  };

  return { teamJoinShowConfig };
};

// export const useTeamJoinFormConfig = () => {
//   const { users, loadingUsers, errorUsers } = useFetchUsers();
//   const { teams, loadingTeams, errorTeams } = useFetchTeams();

//   const loading = loadingUsers||loadingTeams;
//   const error = errorUsers||errorTeams;

//   const teamJoinFormConfig: EntityConfig<TeamJoin> = {
//     entityName: "TeamJoin",
//     endpoint: "teamjoins",
//     fields: [
//   {
//         key: "team_id",
//         label: "Đội nhóm yêu cầu",
//         type: "select",
//         options: teams.map((u) => ({
//           value: u.id,
//           label: u.name || `ID: ${u.id}`,
//         })),
//         required: true,
//         validate: (value: number | undefined) =>
//           value && users.some((u) => u.id === value)
//             ? null
//             : "Đội nhóm yêu cầu không hợp lệ",
//       },
//       {
//         key: "user_id",
//         label: "Người yêu cầu",
//         type: "select",
//         options: users.map((u) => ({
//           value: u.id,
//           label: u.name || `ID: ${u.id}`,
//         })),
//         required: true,
//         validate: (value: number | undefined) =>
//           value && users.some((u) => u.id === value)
//             ? null
//             : "Người yêu cầu không hợp lệ",
//       },
//       {
//         key: "requested_role",
//         label: "Vai trò yêu cầu",
//         type: "select",
//         options: [
//           { value: "leader", label: "Trưởng nhóm" },
//           { value: "translator", label: "Dịch giả" },
//           { value: "proofreader", label: "Biên tập" },
//           { value: "cleaner", label: "Người xử lý ảnh" },
//         ],
//         required: true,
//         validate: (value: string | undefined) =>
//           ["leader", "translator", "proofreader", "cleaner"].includes(
//             value || ""
//           )
//             ? null
//             : "Vai trò không hợp lệ",
//       },
//       {
//         key: "message",
//         label: "Tin nhắn",
//         type: "textarea",
//         required: false,
//         validate: (value: string | undefined) =>
//           value && value.trim().length > 0
//             ? null
//             : "Tin nhắn không được để trống nếu có",
//       },
//       {
//         key: "status",
//         label: "Trạng thái",
//         type: "select",
//         options: [
//           { value: 2, label: "Chờ duyệt" },
//           { value: 1, label: "Đã duyệt" },
//           { value: 0, label: "Bị từ chối" },
//         ],
//         required: true,
//         validate: (value: number | undefined) =>
//           [0, 1, 2].includes(value || -1) ? null : "Trạng thái không hợp lệ",
//       },
//     ],
//   };

//   return { teamJoinFormConfig, loading, error };
// };
