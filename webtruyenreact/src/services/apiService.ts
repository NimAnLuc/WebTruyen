import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để thêm token vào header của mỗi request
apiClient.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem("token");

    if (token) {
      token = token.replace(/^"|"$/g, ""); // Xóa dấu ngoặc kép ở đầu và cuối
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface ApiError {
  message: string;
  status?: number;
}

export interface ApiResponse {
  status: boolean;
  message?: string;
  user?: User;
}
export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  role: string;
  status: number;
  image_url?: string;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}
// ===================== HÀM XỬ LÝ LỖI CHUNG ===================== //
function handleApiError(error: unknown, source: string): never {
  const apiError = error as AxiosError<ApiError>;
  const message =
    apiError?.response?.data?.message ||
    apiError?.message ||
    (error instanceof Error ? error.message : "Lỗi không xác định!");
  console.error(`[apiService.${source}]`, message, error);
  throw new Error(message);
}
export const apiService = {
  fetchList: async <T>(
    endpoint: string,
    queryParams: Record<string, any> = {}
  ): Promise<T> => {
    try {
      const response = await apiClient.get(`/${endpoint}`, {
        params: queryParams,
      });
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || `Lỗi khi lấy danh sách ${endpoint}`
        );
      }

      return responseData.data || responseData;
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi lấy danh sách ${endpoint}`);
      toast.error(message);
      throw new Error(message);
    }
  },
  fetchChapterSearch: async <T>(
    params: { keyword?: string } = {}
  ): Promise<T> => {
    try {
      const response = await apiClient.get("/chapters/filter", { params });
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(responseData.message || "Lỗi khi tìm kiếm");
      }

      return responseData as T;
    } catch (error) {
      handleApiError(error, "fetchChapterSearch");
      throw error; // ✅ giúp component phía trên biết có lỗi
    }
  },

  fetchTrash: async <T>(endpoint: string): Promise<T[]> => {
    try {
      const response = await apiClient.get(`/${endpoint}/trash`);
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || `Lỗi khi lấy thùng rác ${endpoint}`
        );
      }

      return responseData.data || responseData;
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi lấy thùng rác ${endpoint}`);
      toast.error(message);
      throw new Error(message);
    }
  },

  fetchById: async <T>(endpoint: string, id: string): Promise<T> => {
    try {
      const response = await apiClient.get(`/${endpoint}/show/${id}`);
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || `Lỗi khi lấy dữ liệu với ID ${id}`
        );
      }

      return responseData.data || responseData;
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi lấy dữ liệu với ID ${id}`);
      toast.error(message);
      throw new Error(message);
    }
  },

  create: async <T extends { [key: string]: any }>(
    endpoint: string,
    data: T
  ): Promise<T> => {
    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await apiClient.post(`/${endpoint}/store`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || `Lỗi khi tạo dữ liệu ${endpoint}`
        );
      }

      return responseData.data;
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;

      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi tạo dữ liệu ${endpoint}`);
      toast.error(message);
      throw new Error(message);
    }
  },

  update: async <T>(
    endpoint: string,
    id: string,
    data: Partial<T>
  ): Promise<T> => {
    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await apiClient.post(
        `/${endpoint}/update/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || `Lỗi khi cập nhật dữ liệu với ID ${id}`
        );
      }

      return responseData.data;
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        `Lỗi khi cập nhật dữ liệu với ID ${id}`;
      toast.error(message);
      throw new Error(message);
    }
  },

  status: async (endpoint: string, id: string): Promise<void> => {
    try {
      const response = await apiClient.post(`/${endpoint}/status/${id}`);
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || `Lỗi khi cập nhật trạng thái với ID ${id}`
        );
      }
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi cập nhật trạng thái với ID ${id}`);
      toast.error(message);
      throw new Error(message);
    }
  },

  replay: async (endpoint: string, id: string): Promise<void> => {
    try {
      const response = await apiClient.post(`/${endpoint}/replay/${id}`);
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || `Lỗi khi xác nhận trả lời với ID ${id}`
        );
      }
      return responseData;
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi xác nhận trả lời với ID ${id}`);
      toast.error(message);
      throw new Error(message);
    }
  },

  //4 cai
  softDelete: async (endpoint: string, id: string): Promise<void> => {
    try {
      const response = await apiClient.post(`/${endpoint}/delete/${id}`);
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || `Lỗi khi xóa mềm dữ liệu với ID ${id}`
        );
      }
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi xóa mềm dữ liệu với ID ${id}`);
      toast.error(message);
      throw new Error(message);
    }
  },

  restore: async (endpoint: string, id: string): Promise<void> => {
    try {
      const response = await apiClient.post(`/${endpoint}/restore/${id}`);
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || `Lỗi khi khôi phục dữ liệu với ID ${id}`
        );
      }
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi khôi phục dữ liệu với ID ${id}`);
      toast.error(message);
      throw new Error(message);
    }
  },

  permanentDelete: async (endpoint: string, id: string): Promise<void> => {
    try {
      const response = await apiClient.delete(`/${endpoint}/destroy/${id}`);
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || `Lỗi khi xóa vĩnh viễn dữ liệu với ID ${id}`
        );
      }
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi xóa vĩnh viễn dữ liệu với ID ${id}`);
      toast.error(message);
      throw new Error(message);
    }
  },

  softDeleteMultiple: async (
    endpoint: string,
    ids: number[]
  ): Promise<void> => {
    try {
      for (const id of ids) {
        const response = await apiClient.post(`/${endpoint}/delete/${id}`);
        const responseData = response.data;

        if (responseData.status === false) {
          throw new Error(
            responseData.message || `Lỗi khi xóa mềm dữ liệu với ID ${id}`
          );
        }
      }
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi xóa mềm nhiều bản ghi ${endpoint}`);
      toast.error(message);
      throw new Error(message);
    }
  },

  restoreMultiple: async (endpoint: string, ids: number[]): Promise<void> => {
    try {
      for (const id of ids) {
        const response = await apiClient.post(`/${endpoint}/restore/${id}`);
        const responseData = response.data;

        if (responseData.status === false) {
          throw new Error(
            responseData.message || `Lỗi khi khôi phục dữ liệu với ID ${id}`
          );
        }
      }
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi khôi phục nhiều bản ghi ${endpoint}`);
      toast.error(message);
      throw new Error(message);
    }
  },

  permanentDeleteMultiple: async (
    endpoint: string,
    ids: number[]
  ): Promise<void> => {
    try {
      for (const id of ids) {
        const response = await apiClient.delete(`/${endpoint}/destroy/${id}`);
        const responseData = response.data;

        if (responseData.status === false) {
          throw new Error(
            responseData.message || `Lỗi khi xóa vĩnh viễn dữ liệu với ID ${id}`
          );
        }
      }
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : `Lỗi khi xóa vĩnh viễn nhiều bản ghi ${endpoint}`);
      toast.error(message);
      throw new Error(message);
    }
  },


  login: async <T extends Record<string, any>>(data: T): Promise<any> => {
    try {
      const response = await apiClient.post(`/admin/login`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(responseData.message || `Lỗi khi đăng nhập`);
      }

      // Lưu token vào localStorage nếu API trả về token
      if (responseData.token) {
        localStorage.setItem("token", responseData.token);
      }

      return responseData;
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;

      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error ? error.message : `Lỗi khi đăng nhập`);
      toast.error(message);
      throw new Error(message);
    }
  },

  logout: async (): Promise<void> => {
    try {
      const response = await apiClient.post("/logout");
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(responseData.message || "Lỗi khi đăng xuất");
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.success("Đăng xuất thành công!");
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error ? error.message : "Lỗi khi đăng xuất");
      toast.error(message);
      throw new Error(message);
    }
  },
  //api frontend
  fetchHome: async <T>(
    params: { limit?: number; page?: number } = {}
  ): Promise<T> => {
    try {
      const response = await apiClient.get("/home", { params });
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || "Lỗi khi lấy dữ liệu trang chủ"
        );
      }

      return responseData.data || responseData;
    } catch (error) {
      handleApiError(error, "fetchFeatured");
    }
  },
  fetchFeatured: async <T>(params: { limit?: number } = {}): Promise<T> => {
    try {
      const response = await apiClient.get("/featured", { params });
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(responseData.message || "Lỗi khi lấy dữ liệu");
      }

      return responseData.data || responseData;
    } catch (error) {
      handleApiError(error, "fetchFeatured");
    }
  },
  fetchTopViews: async <T>(
    params: { limit?: number; page?: number } = {}
  ): Promise<T> => {
    try {
      const response = await apiClient.get("/topviews", { params });
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(responseData.message || "Lỗi khi lấy dữ liệu");
      }

      return responseData as unknown as T; // Ép kiểu để phù hợp với generic T
    } catch (error) {
      handleApiError(error, "fetchTopViews");
    }
  },
  fetchSearch: async <T>(params: { keyword?: string } = {}): Promise<T> => {
    try {
      const response = await apiClient.get("/search", { params });
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(responseData.message || "Lỗi khi tìm kiếm");
      }

      return responseData;
    } catch (error) {
      handleApiError(error, "fetchSearch");
    }
  },
  // 2 cai
  listgenres: async <T>(params: { limit?: number } = {}): Promise<T> => {
    try {
      const response = await apiClient.get("/listgenres", {
        params,
      });
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || "Lỗi khi lấy danh sách thể loại"
        );
      }

      return responseData;
    } catch (error) {
      handleApiError(error, "listGenres");
    }
  },
  listGenresFooter: async <T>(params: { limit?: number } = {}): Promise<T> => {
    try {
      const response = await apiClient.get("/genres/footer", { params });
      const responseData = response.data;

      if (responseData.status === false) {
        throw new Error(
          responseData.message || "Lỗi khi lấy danh sách thể loại footer"
        );
      }

      return responseData;
    } catch (error) {
      handleApiError(error, "listGenresFooter");
    }
  },
  comicDetail: async <T>(slug: string): Promise<T> => {
    try {
      const response = await apiClient.get(`/comic/detail/${slug}`);
      const data = response.data;

      if (data.status === false) {
        throw new Error(data.message || "Lỗi khi lấy chi tiết truyện");
      }

      return data;
    } catch (error) {
      handleApiError(error, "comicDetail");
    }
  },
  // 🟢 Thêm bookmark
  addBookmark: async <T>(comicId: number): Promise<T> => {
    try {
      const response = await apiClient.post(`/bookmark/${comicId}`);
      const data = response.data;

      if (data.status === false) {
        throw new Error(data.message || "Không thể thêm bookmark");
      }

      return data;
    } catch (error) {
      handleApiError(error, "addBookmark");
    }
  },

  //2 cai
  // 🔴 Xoá bookmark
  removeBookmark: async <T>(comicId: number): Promise<T> => {
    try {
      const response = await apiClient.delete(`/bookmark/${comicId}`);
      const data = response.data;

      if (data.status === false) {
        throw new Error(data.message || "Không thể xoá bookmark");
      }

      return data;
    } catch (error) {
      handleApiError(error, "removeBookmark");
    }
  },

  // 🟡 Lấy danh sách bookmark
  getBookmarks: async <T>(): Promise<T> => {
    try {
      const response = await apiClient.get(`/bookmark`);
      const data = response.data;

      if (data.status === false) {
        throw new Error(data.message || "Không thể lấy danh sách bookmark");
      }

      return data;
    } catch (error) {
      handleApiError(error, "getBookmarks");
    }
  },
  getPagesByChapterId: async <T>(
    chapterId: string,
    comic_slug: string
  ): Promise<T> => {
    try {
      const response = await apiClient.get(
        `/pagecomic/${chapterId}/${comic_slug}`
      );
      const data = response.data;

      if (data.status === false) {
        throw new Error(data.message || "Không thể lấy danh sách trang!");
      }

      return data;
    } catch (error) {
      handleApiError(error, "getPagesByChapterId");
    }
  },
  getComicComments: async <T>(comicId: string, page?: number): Promise<T> => {
    try {
      const response = await apiClient.get(
        `/comic/${comicId}/comments?page=${page}`
      );
      const data = response.data;

      if (!data.status) {
        throw new Error(data.message || "Không thể lấy bình luận!");
      }

      return data;
    } catch (error) {
      handleApiError(error, "getComicComments");
    }
  },
  reportComicError: async <T>(payload: {
    name: string;
    email: string;
    phone?: string;
    title: string;
    content: string;
  }): Promise<T> => {
    try {
      const response = await apiClient.post(`/comic/report-error`, payload);
      const data = response.data;

      if (!data.status) {
        throw new Error(data.message || "Gửi báo lỗi thất bại!");
      }

      return data;
    } catch (error) {
      const apiError = error as AxiosError<ApiError>;
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        (error instanceof Error
          ? error.message
          : "Lỗi không xác định khi gửi báo lỗi!");
      console.error("[pageApi.reportComicError]", error);
      throw new Error(message);
    }
  },
  getChapterComments: async <T>(
    chapterId: string,
    page?: number
  ): Promise<T> => {
    try {
      const response = await apiClient.get(
        `/chapter/${chapterId}/comments?page=${page}`
      );
      const data = response.data;

      if (!data.status) {
        throw new Error(data.message || "Không thể lấy bình luận chương!");
      }

      return data;
    } catch (error) {
      handleApiError(error, "getChapterComments");
    }
  },
  // 🔹 Gửi bình luận mới hoặc trả lời
  postComment: async <T>(payload: {
    comic_id: number;
    chapter_id?: number;
    parent_id?: number;
    content: string;
  }): Promise<T> => {
    try {
      const res = await apiClient.post(`/comments`, payload);
      if (!res.data.status)
        throw new Error(res.data.message || "Gửi bình luận thất bại!");
      return res.data;
    } catch (error: any) {
      handleApiError(error, "postComment");
    }
  },

  //2 cai
  // 🔹 Xóa bình luận
  deleteComment: async <T>(comment_id: number): Promise<T> => {
    try {
      const res = await apiClient.delete(`/comments/${comment_id}`);
      if (!res.data.status)
        throw new Error(res.data.message || "Xóa bình luận thất bại!");
      return res.data;
    } catch (error: any) {
      handleApiError(error, "deleteComment");
    }
  },

  // 🔹 Trả lời bình luận
  replyComment: async <T>(parent_id: number, content: string): Promise<T> => {
    try {
      const res = await apiClient.post(`/comments/${parent_id}/reply`, {
        content,
      });
      if (!res.data.status)
        throw new Error(res.data.message || "Trả lời bình luận thất bại!");
      return res.data;
    } catch (error: any) {
      handleApiError(error, "replyComment");
    }
  },
  // 🔹 Đăng nhập người dùng
  loginUser: async <T>(email: string, password: string): Promise<T> => {
    try {
      const res = await apiClient.post("/loginuser", { email, password });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      if (!res.data.status)
        throw new Error(res.data.message || "Đăng nhập thất bại!");
      return res.data;
    } catch (error: any) {
      handleApiError(error, "loginUser");
    }
  },

  // 🔹 Đăng ký người dùng
  customerRegister: async <T>(
    name: string,
    email: string,
    password: string,
    image: File | string | null
  ): Promise<T> => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (image) {
        formData.append("image", image);
      }

      const res = await apiClient.post("/customer_register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data.status)
        throw new Error(res.data.message || "Đăng ký thất bại!");
      return res.data;
    } catch (error: any) {
      handleApiError(error, "customerRegister");
    }
  },

  // 🔹 Quên mật khẩu
  forgotPassword: async <T>(email: string): Promise<T> => {
    try {
      const res = await apiClient.post("/forgotPassword", { email });
      if (!res.data.status)
        throw new Error(
          res.data.message || "Gửi yêu cầu đặt lại mật khẩu thất bại!"
        );
      return res.data;
    } catch (error: any) {
      handleApiError(error, "forgotPassword");
    }
  },

  // 🔹 Đặt lại mật khẩu
  resetPassword: async <T>(data: {
    email: string;
    token: string;
    password: string;
  }): Promise<T> => {
    try {
      const res = await apiClient.post("/resetPassword", data);
      if (!res.data.status)
        throw new Error(res.data.message || "Đặt lại mật khẩu thất bại!");
      return res.data;
    } catch (error: any) {
      handleApiError(error, "resetPassword");
    }
  },

  // 🔹 Lấy thông tin hồ sơ người dùng
  getUserProfile: async <T>(): Promise<T> => {
    try {
      const res = await apiClient.get("/user/profile");
      if (!res.data.status)
        throw new Error(res.data.message || "Lấy thông tin hồ sơ thất bại!");
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      return res.data;
    } catch (error: any) {
      handleApiError(error, "getUserProfile");
    }
  },
  // 🔹 Lấy danh sách truyện đã theo dõi
  getFollowedComics: async <T>(): Promise<T> => {
    try {
      const res = await apiClient.get(`/user/followed-comics`);
      if (!res.data.status)
        throw new Error(
          res.data.message || "Không thể tải danh sách theo dõi!"
        );
      return res.data;
    } catch (error: any) {
      handleApiError(error, "getFollowedComics");
    }
  },

  // 🔹 Lấy danh sách bình luận của người dùng
  getUserComments: async <T>(): Promise<T> => {
    try {
      const res = await apiClient.get(`/user/comments`);
      if (!res.data.status)
        throw new Error(
          res.data.message || "Không thể tải bình luận người dùng!"
        );
      return res.data;
    } catch (error: any) {
      handleApiError(error, "getUserComments");
    }
  },

  // 🔹 Cập nhật hồ sơ người dùng
  updateProfile: async <T>(
    name: string,

    image: File | string | null
  ): Promise<T> => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (image) {
        formData.append("image", image);
      }

      const res = await apiClient.post("/updateProfile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data.status)
        throw new Error(res.data.message || "Cập nhật hồ sơ thất bại!");

      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      return res.data;
    } catch (error: any) {
      handleApiError(error, "updateProfile");
    }
  },

  // 🔹 Cập nhật tài khoản (email + mật khẩu)
  updateAccount: async <T>(
    email: string,
    current_password: string,
    new_password: string
  ): Promise<T> => {
    try {
      const res = await apiClient.post("/updateAccount", {
        email,
        current_password,
        new_password,
      });
      if (!res.data.status)
        throw new Error(res.data.message || "Cập nhật tài khoản thất bại!");
      return res.data;
    } catch (error: any) {
      handleApiError(error, "updateAccount");
    }
  },

  // 🔹 Xử lý đăng nhập bằng Google
  handleGoogleCallback: async <T>(credential: string): Promise<T> => {
    try {
      const res = await apiClient.post("/handleGoogleCallback", { credential });
      if (!res.data.status)
        throw new Error(res.data.message || "Đăng nhập bằng Google thất bại!");
      return res.data;
    } catch (error: any) {
      handleApiError(error, "handleGoogleCallback");
    }
  },
  //2 cai
  filterComics: async <T>(params: {
    genre_id?: number[] | string; // 1 thể loại hoặc nhiều
    team_id?: number | string;
    comic_status?: "ongoing" | "completed" | "hiatus";
    sort_by?: "views" | "comic_created" | "chapter_created";
    limit?: number;
    page?: number;
    keyword?: string;
  }): Promise<T> => {
    try {
      const res = await apiClient.post("/comics/filter", params);

      if (!res.data.status)
        throw new Error(res.data.message || "Lọc truyện thất bại!");

      return res.data;
    } catch (error: any) {
      handleApiError(error, "filterComics");
    }
  },
  listTeams: async <T>(): Promise<T> => {
    try {
      const res = await apiClient.get("/listteams");

      if (!res.data.status)
        throw new Error(
          res.data.message || "Lấy danh sách nhóm dịch thất bại!"
        );

      return res.data;
    } catch (error: any) {
      handleApiError(error, "listTeams");
    }
  },
  listTeamById: async <T>(id: number): Promise<T> => {
    try {
      const res = await apiClient.get(`/team/${id}`);

      if (!res.data.status)
        throw new Error(
          res.data.message || "Lấy thông tin nhóm dịch thất bại!"
        );

      return res.data;
    } catch (error: any) {
      handleApiError(error, "listTeamById");
    }
  },
  teamJoin: async <T>(data: {
    team_id: number;
    requested_role: string;
    message: string;
  }): Promise<T> => {
    try {
      const res = await apiClient.post(`team/join`, data);

      if (!res.data.status)
        throw new Error(
          res.data.message || "Lấy thông tin nhóm dịch thất bại!"
        );

      return res.data;
    } catch (error: any) {
      handleApiError(error, "teamJoin");
    }
  },
  requestTeamCreation: async (
    data:
      | FormData
      | {
          team_name: string;
          description?: string;
          reason: string;
        }
  ): Promise<ApiResponse> => {
    try {
      const isFormData = data instanceof FormData;

      const res = await apiClient.post(
        `/team/request-create`,
        data,
        isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
      );

      if (!res.data.status)
        throw new Error(
          res.data.message || "Gửi yêu cầu tạo nhóm dịch thất bại!"
        );

      return res.data;
    } catch (error: any) {
      handleApiError(error, "requestTeamCreation");
    }
  },

  increaseChapterView: async (chapter_id: number): Promise<ApiResponse> => {
    try {
      const res = await apiClient.post(`/chapter/increase-view`, {
        chapter_id: chapter_id,
      });

      if (!res.data.status)
        throw new Error(res.data.message || "Tăng view chapter thất bại!");

      return res.data;
    } catch (error: any) {
      handleApiError(error, "increaseChapterView");
    }
  },
};
