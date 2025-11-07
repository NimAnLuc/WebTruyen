import React from "react";
import GenericList from "../../../components/generic/GenericList.tsx";
import { useBookmarkListConfig } from "../../../config/entityConfigs.tsx";
import { Bookmark } from "../../../types/index";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const BookmarkListPage: React.FC = () => {
  const { bookmarkListConfig, loading: configLoading, error: configError } = useBookmarkListConfig();

  if (configLoading) {
    return <LoadingAdmin/>;
  }

  if (configError) {
    return <div>Lỗi: {configError}</div>;
  }

  return <GenericList<Bookmark> config={bookmarkListConfig} />;
};

export default BookmarkListPage;