import React, { useState, useEffect } from "react";
import GenericTrash from "../../../components/generic/GenericTrash.tsx";
import { usePageListConfig } from "../../../config/entityConfigs.tsx";
import { apiService } from "../../../services/apiService.ts";
import { Page } from "../../../types/index";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";


const PageTrashPage: React.FC = () => {
  const { pageListConfig, loading: configLoading, error: configError } = usePageListConfig();
  const [pages, setPages] = useState<Page[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    setDataLoading(true);
    apiService
      .fetchTrash<Page>(pageListConfig.endpoint)
      .then((data) => {
        setPages((data as any).pages);
        setDataLoading(false);
      })
      .catch(() => {
        setDataError("Lỗi khi tải danh sách thùng rác!");
        setDataLoading(false);
      });
  }, [pageListConfig.endpoint]);

  if (configLoading || dataLoading) {
    return <LoadingAdmin/>;
  }

  if (configError || dataError) {
    return <div>Lỗi: {configError || dataError}</div>;
  }

  return <GenericTrash config={pageListConfig} data={pages} setData={setPages} />;
};

export default PageTrashPage;