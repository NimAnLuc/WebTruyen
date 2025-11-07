import React from "react";
import GenericShow from "../../../components/generic/GenericShow.tsx";
import { useTeamShowConfig } from "../../../config/entityConfigs.tsx";
import { Team } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const TeamShowPage: React.FC = () => {
  const { teamShowConfig, loading, error } = useTeamShowConfig();

  if (loading) {
    return <LoadingAdmin />;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  return (
    <GenericShow
      config={teamShowConfig}
      fetchData={(id) =>
        apiService.fetchById<Team>(teamShowConfig.endpoint, id)
      }
    />
  );
};

export default TeamShowPage;
