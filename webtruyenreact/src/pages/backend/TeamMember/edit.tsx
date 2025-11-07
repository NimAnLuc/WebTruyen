import React, { useState, useEffect } from "react";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useTeamMemberFormConfig } from "../../../config/entityConfigs.tsx";
import { TeamMember } from "../../../types/index";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const TeamMemberEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    teamMemberFormConfig,
    loading: configLoading,
    error: configError,
  } = useTeamMemberFormConfig();
  const [initialData, setInitialData] = useState<TeamMember | undefined>();
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setDataLoading(true);
      apiService
        .fetchById<{teammember:TeamMember}>(teamMemberFormConfig.endpoint, id)
        .then((data) => {
          setInitialData(data.teammember); // Giả sử API trả về dữ liệu trong teammembers
          setDataLoading(false);
        })
        .catch(() => {
          setDataError("Không tìm thấy teammember!");
          toast.error("Không tìm thấy teammember!");
          setDataLoading(false);
        });
    }
  }, [id, teamMemberFormConfig.endpoint]);

  const handleSubmit = async (data: TeamMember) => {
    if (id) {
      setIsSubmitting(true);
      try {
        await apiService.update(teamMemberFormConfig.endpoint, id, data);

        toast.success("Cập nhật teammember thành công!");
        navigate("/admin/teammember");
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi cập nhật teammember!");
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
      <h1>Chỉnh sửa TeamMember</h1>
      <GenericForm
        config={teamMemberFormConfig}
        data={initialData}
        isEdit
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default TeamMemberEditPage;
