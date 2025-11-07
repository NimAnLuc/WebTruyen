import React, { useState, useEffect } from "react";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useBookmarkFormConfig } from "../../../config/entityConfigs.tsx";
import { Bookmark } from "../../../types/index";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const BookmarkEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { bookmarkFormConfig, loading: configLoading, error: configError } = useBookmarkFormConfig();
  const [initialData, setInitialData] = useState<Bookmark | undefined>();
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setDataLoading(true);
      apiService
        .fetchById<{ bookmarks: Bookmark } >(bookmarkFormConfig.endpoint, id)
        .then((data) => {
          setInitialData(data.bookmarks);

          setDataLoading(false);
        })
        .catch(() => {
          setDataError("Không tìm thấy bookmark!");
          toast.error("Không tìm thấy bookmark!");
          setDataLoading(false);
        });
    }
  }, [id, bookmarkFormConfig.endpoint]);

  const handleSubmit = async (data: Bookmark) => {
    if (id) {
      try {
        await apiService.update(bookmarkFormConfig.endpoint, id, data);
        toast.success("Cập nhật bookmark thành công!");
      } catch (err) {
        // Lỗi đã được xử lý trong apiService (hiển thị toast), không cần làm gì thêm
      }
    }
  };

  if (configLoading || dataLoading) {
    return <LoadingAdmin/>;
  }

  if (configError || dataError) {
    return <div>Lỗi: {configError || dataError}</div>;
  }

  return (
    <GenericForm
      config={bookmarkFormConfig}
      data={initialData}
      isEdit
      onSubmit={handleSubmit}
    />
  );
};

export default BookmarkEditPage;