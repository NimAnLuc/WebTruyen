import React from "react";
import GenericList from "../../../components/generic/GenericList.tsx";
import { useTeamMemberListConfig } from "../../../config/entityConfigs.tsx";
import { TeamMember } from "../../../types/index";

const TeamMemberListPage: React.FC = () => {
  const { teamMemberListConfig} = useTeamMemberListConfig();


  return <GenericList<TeamMember> config={teamMemberListConfig} />;
};

export default TeamMemberListPage;