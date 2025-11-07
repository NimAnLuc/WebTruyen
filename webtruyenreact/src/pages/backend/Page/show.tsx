import React from "react";
import GenericShow from "../../../components/generic/GenericShow.tsx";
import { usePageShowConfig } from "../../../config/entityConfigs.tsx";
import { Page } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const PageShowPage: React.FC = () => {
  const { pageShowConfig, loading, error } = usePageShowConfig();

  if (loading) {
    return <LoadingAdmin/>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  return (
    <GenericShow
      config={pageShowConfig}
      fetchData={(id) => apiService.fetchById<Page>(pageShowConfig.endpoint, id)}
    />
  );
};

export default PageShowPage;