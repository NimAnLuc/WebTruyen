import React, { useEffect, useState } from "react";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

import RequestCreateTeamModal from "../../../components/form/RequestCreateTeamModal.tsx";
interface Leader {
  id: number;
  name: string;
  image_url?: string | null;
}

interface Team {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  status: number;
  leader?: Leader;
}

const ListTeams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await apiService.listTeams<{ teams: Team[] }>();
        setTeams(res.teams);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách nhóm dịch!");
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Đang tải danh sách nhóm dịch...</p>
      </div>
    );
  }

  return (
    <div className="container my-4 bg-white border rounded p-3">
      <h3 className="fw-bold mb-4 text-center">Danh sách nhóm dịch</h3>
      <button className="btn btn-success my-3" onClick={() => setShowModal(true)}>
        Yêu cầu tạo nhóm dịch
      </button>
      {teams.length === 0 ? (
        <div className="text-center text-muted py-5">
          Chưa có nhóm dịch nào hoạt động!
        </div>
      ) : (
        <div className="row g-4">
          {teams.map((team) => (
            <div key={team.id} className="col-6 col-md-3">
              <Link
                to={`/teams/${team.id}`}
                className="text-decoration-none text-dark"
              >
                <div className="card h-100 text-center shadow-sm border-0 hover-shadow transition-all">
                  <div className="card-body">
                    <img
                      src={
                        team.logo
                          ? `${team.logo}`
                          : "/images/logo.png"
                      }
                      alt={team.name}
                      className="rounded-circle mb-3"
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        border: "2px solid #ddd",
                      }}
                    />
                    <h6 className="fw-bold text-uppercase mb-1">{team.name}</h6>
                    <small className="text-muted">
                      👑 {team.leader?.name || "Không rõ"}
                    </small>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
      <RequestCreateTeamModal
        show={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default ListTeams;
