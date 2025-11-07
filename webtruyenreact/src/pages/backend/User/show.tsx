import React from "react";
import GenericShow from "../../../components/generic/GenericShow.tsx";
import { useUserShowConfig } from "../../../config/entityConfigs.tsx";
import { User } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const UserShowPage: React.FC = () => {
  const { userShowConfig, loading, error } = useUserShowConfig();

  if (loading) {
    return <LoadingAdmin/>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  return (
    <GenericShow
      config={userShowConfig}
      fetchData={(id) => apiService.fetchById<User>(userShowConfig.endpoint, id)}
    />
  );
};

export default UserShowPage;