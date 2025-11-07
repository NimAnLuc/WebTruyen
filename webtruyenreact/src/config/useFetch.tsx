import { useEffect, useState } from "react";
import { apiService } from "../services/apiService.ts";
import {
  User,
  Comic,
  Comment,
  Team,
  Genre,
  Page,
  Chapter,
  ApiListResponse,
  TeamJoin,
} from "../types/index";
// Hook để fetch users
export const useFetchUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersData = (await apiService.fetchList<User>(
          "users"
        )) as unknown as ApiListResponse<User>;
        setUsers(usersData.users);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return { users, loadingUsers: loading, errorUsers: error };
};
export const useFetchUsers1 = (teamId?: number) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        // Gọi API /teamjoins
        const response = (await apiService.fetchList<TeamJoin>(
          teamId ? `teamjoins?team_id=${teamId}` : "teamjoins"
        )) as unknown as ApiListResponse<TeamJoin>;

        // Chuyển đổi dữ liệu teamjoins thành danh sách users
        const uniqueUsers = Array.from(
          new Map(
            response.teamjoins.map((join) => [
              join.user_id,
              { id: join.user_id, name: join.username },
            ])
          ).values()
        );

        setUsers(uniqueUsers);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu users từ teamjoins");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [teamId]); // Thêm teamId vào dependency array nếu cần lọc theo team

  return { users, loadingUsers: loading, errorUsers: error };
};
// Hook để fetch comments
export const useFetchComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        const commentsData = (await apiService.fetchList<Comment>(
          "comments"
        )) as unknown as ApiListResponse<Comment>;
        setComments(commentsData.comments);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu comments");
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, []);

  return { comments, loadingComments: loading, errorComments: error };
};
// Hook để fetch genres
export const useFetchGenres = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        setLoading(true);
        const genresData = (await apiService.fetchList<Genre>(
          "genres"
        )) as unknown as ApiListResponse<Genre>;
        setGenres(genresData.genres);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu genres");
      } finally {
        setLoading(false);
      }
    };

    loadGenres();
  }, []);

  return { genres, loadingGenres: loading, errorGenres: error };
};

// Hook để fetch comics
export const useFetchComics = () => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComics = async () => {
      try {
        setLoading(true);
        const comicsData = (await apiService.fetchList<Comic>(
          "comics"
        )) as unknown as ApiListResponse<Comic>;
        setComics(comicsData.comics);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu comics");
      } finally {
        setLoading(false);
      }
    };

    loadComics();
  }, []);

  return { comics, loadingComics: loading, errorComics: error };
};
export const useFetchTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeams = async () => {
      // Lấy user.role từ localStorage
      const userData = localStorage.getItem("user");
      const userRole = userData ? JSON.parse(userData).role : null;

      // Nếu user có role là team, bỏ qua gọi API
      if (userRole === "team") {
        setTeams([]);
        setLoading(false);
        setError(null);
        return;
      }

      // Gọi API cho các role khác (ví dụ: admin)
      try {
        setLoading(true);
        const teamsData = (await apiService.fetchList<Team>(
          "teams"
        )) as unknown as ApiListResponse<Team>;
        setTeams(teamsData.teams);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu teams");
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  return { teams, loadingTeams: loading, errorTeams: error };
};
// Hook để fetch chapters
export const useFetchChapters = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChapters = async () => {
      try {
        setLoading(true);
        const chaptersData = (await apiService.fetchList<Chapter>(
          "chapters"
        )) as unknown as ApiListResponse<Chapter>;
        setChapters(chaptersData.chapters);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu chapters");
      } finally {
        setLoading(false);
      }
    };

    loadChapters();
  }, []);

  return { chapters, loadingChapters: loading, errorChapters: error };
};

// Hook để fetch pages
export const useFetchPages = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoading(true);
        const pagesData = (await apiService.fetchList<Page>(
          "pages"
        )) as unknown as ApiListResponse<Page>;
        setPages(pagesData.pages);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu pages");
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, []);

  return { pages, loadingPages: loading, errorPages: error };
};
export const useFetchSearchChapters = (keyword: string) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!keyword) return; // ❌ Không tìm nếu chưa có keyword

    const loadChapters = async () => {
      try {
        setLoading(true);
        const response = await apiService.fetchChapterSearch<
          ApiListResponse<Chapter>
        >({
          keyword,
        });

        setChapters(response.chapters || []);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu chapters");
      } finally {
        setLoading(false);
      }
    };

    loadChapters();
  }, [keyword]); // ✅ chạy lại mỗi khi keyword thay đổi

  return { chapters, loadingChapters: loading, errorChapters: error };
};
