import React, { useState, useEffect } from "react";
import GenericTrash from "../../../components/generic/GenericTrash.tsx";
import { useTeamJoinListConfig } from "../../../config/entityConfigs.tsx";
import { apiService } from "../../../services/apiService.ts";
import { TeamJoin } from "../../../types/index";
import { toast } from "react-toastify";


const TeamJoinTrashPage: React.FC = () => {
  const { teamJoinListConfig } = useTeamJoinListConfig();
  const [teamjoins, setTeamJoins] = useState<TeamJoin[]>([]);


  useEffect(() => {

    apiService
      .fetchTrash<TeamJoin>(teamJoinListConfig.endpoint)
      .then((data) => {
        setTeamJoins((data as any).teamjoins);

      })
      .catch(() => {
        toast.error("Lỗi khi tải danh sách thùng rác!");

      });
  }, [teamJoinListConfig.endpoint]);


  return <GenericTrash config={teamJoinListConfig} data={teamjoins} setData={setTeamJoins} />;
};

export default TeamJoinTrashPage;