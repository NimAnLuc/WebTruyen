import React from "react";
import GenericShow from "../../../components/generic/GenericShow.tsx";
import { useTeamMemberShowConfig } from "../../../config/entityConfigs.tsx";
import { TeamMember } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";

const TeamMemberShowPage: React.FC = () => {
  const { teamMemberShowConfig} = useTeamMemberShowConfig();


  return (
    <GenericShow
      config={teamMemberShowConfig}
      fetchData={(id) => apiService.fetchById<TeamMember>(teamMemberShowConfig.endpoint, id)}
    />
  );
};

export default TeamMemberShowPage;