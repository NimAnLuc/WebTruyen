import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import ComicCard from "../../../components/comic/ComicCard.tsx";
import JoinTeamModal from "../../../components/form/JoinTeamModal.tsx";

interface Leader {
  id: number;
  name: string;
  image_url?: string | null;
}

interface TeamMember {
  user: {
    id: number;
    name: string;
    image_url?: string | null;
  };
  role: string;
}

interface Team {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  status: number;
  leader?: Leader;
  members?: TeamMember[];
}

interface Comic {
  id: number;
  title: string;
  slug: string;
  cover_image: string;
  chapters?: {
    id: number;
    slug: string;
    chapter_number: number;
    created_at: string;
  }[];
}
// ✅ Khai báo kiểu rõ ràng cho comic_status
type ComicStatus = "ongoing" | "completed" | "hiatus" | "";

const TeamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);
  const [team, setTeam] = useState<Team | null>(null);
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ thêm state cho phân trang và lọc
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [comicStatus, setComicStatus] = useState<ComicStatus>("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isMember = team?.members?.some((m) => m.user.id === user?.id);

  // 🟢 Lấy thông tin nhóm
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const teamRes = await apiService.listTeamById<{ team: Team }>(teamId!);
        setTeam(teamRes.team);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải thông tin nhóm dịch!");
      }
    };
    if (teamId) fetchTeam();
  }, [teamId]);

  // 🔵 Lấy truyện theo nhóm + filter + phân trang
  useEffect(() => {
    const fetchComics = async () => {
      try {
        const res = await apiService.filterComics<{ comics: Comic[] }>({
          team_id: id,
          comic_status: comicStatus || undefined,
          limit: 16,
          page,
        });

        setComics((prev) =>
          page === 1 ? res.comics : [...prev, ...res.comics]
        );
        setHasMore(res.comics.length === 16);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách truyện!");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchComics();
  }, [id, page, comicStatus]);

  if (loading)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Đang tải thông tin nhóm dịch...</p>
      </div>
    );

  if (!team)
    return (
      <div className="text-center text-muted py-5">
        Không tìm thấy thông tin nhóm dịch.
      </div>
    );

  return (
    <div className="container my-4 bg-white border rounded p-3">
      {/* 🟢 Thông tin nhóm */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <img
          src={
            team.logo
              ? `${team.logo}`
              : "/images/logo.png"
          }
          alt={team.name}
          className="rounded-circle border"
          style={{
            width: "100px",
            height: "100px",
            objectFit: "cover",
          }}
        />
        <div>
          <h3 className="fw-bold mb-1 text-uppercase">{team.name}</h3>

          <p className="text-muted mb-2">
            👑 Trưởng nhóm: {team.leader?.name || "Không rõ"}
          </p>
          {team.description && <p className="mb-0">{team.description}</p>}
        </div>
      </div>
      {/* Nút tham gia nhóm */}
      {user && !isMember && (
        <>
          <button
            className="btn btn-primary my-3"
            onClick={() => setShowJoinModal(true)}
          >
            Tham gia nhóm
          </button>

          <JoinTeamModal
            show={showJoinModal}
            handleClose={() => setShowJoinModal(false)}
            teamId={team.id}
            teamName={team.name}
          />
        </>
      )}

      {/* 🟣 Danh sách thành viên */}
      {team.members && team.members.length > 0 && (
        <div className="mb-5">
          <h5 className="fw-bold mb-3">Thành viên nhóm</h5>
          <div className="d-flex flex-wrap gap-3">
            {team.members.map((member) => (
              <div
                key={member.user.id}
                className="text-center border rounded p-2"
                style={{ width: "120px" }}
              >
                <img
                  src={
                    member.user.image_url
                      ? `${member.user.image_url}`
                      : "/images/logo.png"
                  }
                  alt={member.user.name}
                  className="rounded-circle mb-2"
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                  }}
                />
                <div className="fw-semibold small text-truncate">
                  {member.user.name}
                </div>
                <div className="text-muted small">{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔵 Danh sách truyện */}
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Truyện của nhóm</h5>

          {/* Bộ lọc trạng thái */}
          {/* Bộ lọc trạng thái */}
          <select
            className="form-select w-auto"
            value={comicStatus}
            onChange={(e) => {
              setComicStatus(e.target.value as ComicStatus);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            <option value="ongoing">Đang tiến hành</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="hiatus">Tạm ngưng</option>
          </select>
        </div>

        <div className="row g-4">
          {comics.length > 0 ? (
            comics.map((comic) => (
              <div key={comic.id} className="col-6 col-md-3">
                <ComicCard comic={comic} />
              </div>
            ))
          ) : (
            <div className="text-center text-muted py-5">
              Nhóm này chưa đăng truyện nào.
            </div>
          )}
        </div>

        {/* Nút xem thêm */}
        {hasMore && (
          <div className="text-center mt-4">
            <button
              className="btn btn-outline-primary px-4"
              onClick={() => setPage((prev) => prev + 1)}
            >
              Xem thêm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;
