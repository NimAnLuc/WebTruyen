import React, { useState, useEffect } from "react";
import GenericTrash from "../../../components/generic/GenericTrash.tsx";
import { useBookmarkListConfig } from "../../../config/entityConfigs.tsx";
import { apiService } from "../../../services/apiService.ts";
import { Bookmark } from "../../../types/index";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const BookmarkTrashPage: React.FC = () => {
  const {
    bookmarkListConfig,
    loading: configLoading,
    error: configError,
  } = useBookmarkListConfig();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    setDataLoading(true);
    apiService
      .fetchTrash<Bookmark>(bookmarkListConfig.endpoint)
      .then((data) => {
        setBookmarks((data as any).bookmarks);
        setDataLoading(false);
      })
      .catch(() => {
        setDataError("Lỗi khi tải danh sách thùng rác!");
        setDataLoading(false);
      });
  }, [bookmarkListConfig.endpoint]);

  if (configLoading || dataLoading) {
    return <LoadingAdmin />;
  }

  if (configError || dataError) {
    return <div>Lỗi: {configError || dataError}</div>;
  }

  return (
    <GenericTrash
      config={bookmarkListConfig}
      data={bookmarks}
      setData={setBookmarks}
    />
  );
};

export default BookmarkTrashPage;
