import React from "react";
import GenericShow from "../../../components/generic/GenericShow.tsx";
import { useTeamJoinShowConfig } from "../../../config/entityConfigs.tsx";
import { TeamJoin } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";

const TeamJoinShowPage: React.FC = () => {
  const { teamJoinShowConfig } = useTeamJoinShowConfig();


  return (
    <GenericShow
      config={teamJoinShowConfig}
      fetchData={(id) => apiService.fetchById<TeamJoin>(teamJoinShowConfig.endpoint, id)}
    />
  );
};

export default TeamJoinShowPage;