import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useTeamMemberFormConfig } from "../../../config/entityConfigs.tsx";
import { TeamMember } from "../../../types/index.ts";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const TeamMemberAddPage: React.FC = () => {
  const {
    teamMemberFormConfig,
    loading: configLoading,
    error: configError,
  } = useTeamMemberFormConfig();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: TeamMember) => {
    if (!teamMemberFormConfig.endpoint) {
      toast.error("Lỗi: Endpoint không được cấu hình!");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.create(teamMemberFormConfig.endpoint, data);
      toast.success("Thêm teammember thành công!");
      navigate("/admin/teammember");
    } catch (error: any) {
      if (error.message === "TeamMember đã tồn tại") {
        toast.error("TeamMember đã tồn tại, vui lòng kiểm tra lại!");
      } else {
        toast.error(error.message || "Lỗi khi thêm teammember!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (configLoading) {
    return <LoadingAdmin/>;
  }

  if (configError) {
    return <div>Lỗi: {configError}</div>;
  }

  return (
    <div>
      <h1>Thêm TeamMember</h1>
      <GenericForm
        config={teamMemberFormConfig}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default TeamMemberAddPage;
