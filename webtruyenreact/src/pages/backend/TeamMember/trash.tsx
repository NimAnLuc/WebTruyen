import React, { useState, useEffect } from "react";
import GenericTrash from "../../../components/generic/GenericTrash.tsx";
import { useTeamMemberListConfig } from "../../../config/entityConfigs.tsx";
import { apiService } from "../../../services/apiService.ts";
import { TeamMember } from "../../../types/index";
import { toast } from "react-toastify";


const TeamMemberTrashPage: React.FC = () => {
  const { teamMemberListConfig } = useTeamMemberListConfig();
  const [teammembers, setTeamMembers] = useState<TeamMember[]>([]);


  useEffect(() => {

    apiService
      .fetchTrash<TeamMember>(teamMemberListConfig.endpoint)
      .then((data) => {
        setTeamMembers((data as any).teammembers);
      })
      .catch(() => {
        toast.error("Lỗi khi tải danh sách thùng rác!");
  
      });
  }, [teamMemberListConfig.endpoint]);

  return <GenericTrash config={teamMemberListConfig} data={teammembers} setData={setTeamMembers} />;
};

export default TeamMemberTrashPage;