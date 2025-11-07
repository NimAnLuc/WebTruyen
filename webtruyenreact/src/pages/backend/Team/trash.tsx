import React, { useState, useEffect } from "react";
import GenericTrash from "../../../components/generic/GenericTrash.tsx";
import { useTeamListConfig } from "../../../config/entityConfigs.tsx";
import { apiService } from "../../../services/apiService.ts";
import { Team } from "../../../types/index";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";


const TeamTrashPage: React.FC = () => {
  const { teamListConfig, loading: configLoading, error: configError } = useTeamListConfig();
  const [teams, setTeams] = useState<Team[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    setDataLoading(true);
    apiService
      .fetchTrash<Team>(teamListConfig.endpoint)
      .then((data) => {
        setTeams((data as any).teams);
        setDataLoading(false);
      })
      .catch(() => {
        setDataError("Lỗi khi tải danh sách thùng rác!");
        setDataLoading(false);
      });
  }, [teamListConfig.endpoint]);

  if (configLoading || dataLoading) {
    return <LoadingAdmin/>;
  }

  if (configError || dataError) {
    return <div>Lỗi: {configError || dataError}</div>;
  }

  return <GenericTrash config={teamListConfig} data={teams} setData={setTeams} />;
};

export default TeamTrashPage;