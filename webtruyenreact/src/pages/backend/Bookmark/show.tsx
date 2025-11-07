import React from "react";
import GenericShow from "../../../components/generic/GenericShow.tsx";
import { useBookmarkShowConfig } from "../../../config/entityConfigs.tsx";
import { Bookmark } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const BookmarkShowPage: React.FC = () => {
  const { bookmarkShowConfig, loading, error } = useBookmarkShowConfig();

  if (loading) {
    return <LoadingAdmin/>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  return (
    <GenericShow
      config={bookmarkShowConfig}
      fetchData={(id) => apiService.fetchById<Bookmark>(bookmarkShowConfig.endpoint, id)}
    />
  );
};

export default BookmarkShowPage;