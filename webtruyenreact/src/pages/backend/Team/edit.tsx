import React, { useState, useEffect } from "react";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useTeamFormConfig } from "../../../config/entityConfigs.tsx";
import { Team } from "../../../types/index";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const TeamEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    teamFormConfig,
    loading: configLoading,
    error: configError,
  } = useTeamFormConfig();
  const [initialData, setInitialData] = useState<Team | undefined>();
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setDataLoading(true);
      apiService
        .fetchById<{teams:Team}>(teamFormConfig.endpoint, id)
        .then((data) => {
          setInitialData(data.teams); // Giả sử API trả về dữ liệu trong teams
          setDataLoading(false);
        })
        .catch(() => {
          setDataError("Không tìm thấy team!");
          toast.error("Không tìm thấy team!");
          setDataLoading(false);
        });
    }
  }, [id, teamFormConfig.endpoint]);

  const handleSubmit = async (data: Team) => {
    if (id) {
      setIsSubmitting(true);
      try {
        await apiService.update(teamFormConfig.endpoint, id, data);

        toast.success("Cập nhật team thành công!");
        navigate("/admin/team");
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi cập nhật team!");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (configLoading || dataLoading) {
    return <LoadingAdmin/>;
  }

  if (configError || dataError) {
    return <div>Lỗi: {configError || dataError}</div>;
  }

  return (
    <div>
      <h1>Chỉnh sửa Team</h1>
      <GenericForm
        config={teamFormConfig}
        data={initialData}
        isEdit
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default TeamEditPage;
