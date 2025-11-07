import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useTeamFormConfig } from "../../../config/entityConfigs.tsx";
import { Team } from "../../../types/index.ts";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const TeamAddPage: React.FC = () => {
  const {
    teamFormConfig,
    loading: configLoading,
    error: configError,
  } = useTeamFormConfig();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: Team) => {
    if (!teamFormConfig.endpoint) {
      toast.error("Lỗi: Endpoint không được cấu hình!");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.create(teamFormConfig.endpoint, data);
      toast.success("Thêm team thành công!");
      navigate("/admin/team");
    } catch (error: any) {
      if (error.message === "Team đã tồn tại") {
        toast.error("Team đã tồn tại, vui lòng kiểm tra lại!");
      } else {
        toast.error(error.message || "Lỗi khi thêm team!");
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
      <h1>Thêm Team</h1>
      <GenericForm
        config={teamFormConfig}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default TeamAddPage;
