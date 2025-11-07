import React from "react";
import GenericList from "../../../components/generic/GenericList.tsx";
import { usePageListConfig } from "../../../config/entityConfigs.tsx";
import { Page } from "../../../types/index";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const PageListPage: React.FC = () => {
  const { pageListConfig, loading: configLoading, error: configError } = usePageListConfig();

  if (configLoading) {
    return <LoadingAdmin/>;
  }

  if (configError) {
    return <div>Lỗi: {configError}</div>;
  }

  return <GenericList<Page> config={pageListConfig} />;
};

export default PageListPage;