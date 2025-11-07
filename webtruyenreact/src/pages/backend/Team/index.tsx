import React from "react";
import GenericList from "../../../components/generic/GenericList.tsx";
import { useTeamListConfig } from "../../../config/entityConfigs.tsx";
import { Team } from "../../../types/index";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const TeamListPage: React.FC = () => {
  const { teamListConfig, loading: configLoading, error: configError } = useTeamListConfig();

  if (configLoading) {
    return <LoadingAdmin/>;
  }

  if (configError) {
    return <div>Lỗi: {configError}</div>;
  }

  return <GenericList<Team> config={teamListConfig} />;
};

export default TeamListPage;