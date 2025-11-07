export interface User {
  id: number;
  name: string;
  email?: string;
  role?: "admin" | "user" | "team";
  status?: number;
  image_url?: string;
  email_verified_at?: string | null;
  password?: string;
  created_by?: number;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Team {
  id: number;
  name: string;
  description?: string | null;
  slug?: string | null;
  logo?: string | null;
  leader_id?: number;
  status?: number;
  created_by?: number;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}
export interface TeamMember {
  id: number;
  team_id?: number;
  user_id?: number;
  role?: "leader" | "translator" | "proofreader" | "cleaner";
  status?: number;
  created_by?: number;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  username: string;
  team_name: string;
  creator_name?: string | null;
  updater_name?: string | null;
}

export interface Comic {
  id: number;
  title: string;
  description?: string | null;
  author_name?: string | null;
  team_id?: number;
  team_name?: string | null;
  comic_status?: "ongoing" | "completed" | "hiatus";
  cover_image?: File | string;
  status?: number;
  views?: number;
  slug?: string | null;
  created_by?: number;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  creator_name?: string | null;
  updater_name?: string | null;
  genre_ids?: number;
  genres?: string | null;
}

export interface Bookmark {
  id: number;
  user_id: number;
  comic_id: number;
  status?: number;
  created_at?: string | null;
  created_by?: number;
  updated_at?: string | null;
  updated_by?: number | null;
}

export interface Genre {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  status?: number;
  created_at?: string | null;
  created_by?: number;
  updated_at?: string | null;
  updated_by?: number | null;
}
export interface Page {
  id: number;
  chapter_id: number;
  page_number: number;
  image_url: File | string;
  status?: number;
  created_at?: string | null;
  created_by?: number;
  updated_at?: string | null;
  updated_by?: number | null;
  creator_name?: string | null;
  updater_name?: string | null;
}
export interface Chapter {
  id: number;
  comic_id: number;
  chapter_number?: number;
  title: string;
  comic_title: string;
  slug?: string | null;
  view_count?: number;
  status?: number;
  created_at?: string | null;
  created_by?: number;
  updated_at?: string | null;
  updated_by?: number | null;
  creator_name?: string | null;
  updater_name?: string | null;
}
export interface Comment {
  id: number;
  comic_id: number;
  chapter_title: string;
  comic_title: string;
  chapter_id: number;
  user_id: number;
  user_name: string;
  parent_id: number;
  content: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  title: string;
  content: string;
  replay_id?: number | null;
  user_id?: number | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: number;
}
export interface TeamJoin {
  id: number;
  team_id: number;
  user_id: number;
  approver_id?: number | null;
  requested_role?: "leader" | "translator" | "proofreader" | "cleaner";
  message?: string | null;
  team_name: string;
  username: string;

  approver_name: string;
  created_by?: number | null;
  updated_by?: number | null;
  creator_name?: string | null;
  updater_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: number;
}
// Định nghĩa interface cho cấu hình trường (FieldConfig)
export interface FieldConfig<T> {
  key: keyof T;
  endpoint?: string;

  label: string;
  render?: (value: any, item: T) => React.ReactNode; // Hàm render tùy chỉnh
  sortable?: boolean; // Có thể sắp xếp không
  searchable?: boolean; // Có thể tìm kiếm không
  type?:
    | "text"
    | "number"
    | "select"
    | "file"
    | "textarea"
    | "multi-select"
    | "password"
    | "hidden";
  options?: { value: any; label: string }[]; // Tùy chọn cho select
  required?: boolean | ((formData: Partial<T>) => boolean);
  validate?: (value: any, formData: Partial<T>) => string | null;
  readOnly?: boolean;
  disabled?: boolean;
  async?: boolean;
}

// Định nghĩa interface cho cấu hình entity (EntityConfig)
export interface EntityConfig<T> {
  entityName: string; // Tên entity (ví dụ: "Bookmark", "Author")
  endpoint: string; // API endpoint (ví dụ: "/api/bookmarks")

  fields: FieldConfig<T>[]; // Danh sách các trường hiển thị
  statusField?: keyof T; // Trường trạng thái (nếu có)
  statusLabels?: Record<number, string>; // Nhãn cho các giá trị trạng thái
  searchFields?: (keyof T)[]; // Các trường dùng để tìm kiếm
  titleField?: keyof T;
}
// Interface cho response wrapper từ API (giả sử cấu trúc { [endpoint]: T[] })
export interface ApiListResponse<T> {
  [key: string]: T[]; // Thuộc tính động dựa trên endpoint, ví dụ: users: User[], comics: Comic[]
  // Nếu API có thêm metadata, thêm vào đây: total?: number; page?: number; etc.
}
