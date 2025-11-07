import React, { useState, useEffect } from "react";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useChapterFormConfig } from "../../../config/entityConfigs.tsx";
import { Chapter } from "../../../types/index";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const ChapterEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { chapterFormConfig, loading: configLoading, error: configError } = useChapterFormConfig();
  const [initialData, setInitialData] = useState<Chapter | undefined>();
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setDataLoading(true);
      apiService
        .fetchById<{ chapters: Chapter }>(chapterFormConfig.endpoint, id)
        .then((data) => {
          setInitialData(data.chapters);
        
          setDataLoading(false);
        })
        .catch(() => {
          setDataError("Không tìm thấy chapter!");
          toast.error("Không tìm thấy chapter!");
          setDataLoading(false);
        });
    }
  }, [id, chapterFormConfig.endpoint]);

  const handleSubmit = async (data: Chapter) => {
    if (id) {
      try {
        await apiService.update(chapterFormConfig.endpoint, id, data);
        toast.success("Cập nhật chapter thành công!");
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
      config={chapterFormConfig}
      data={initialData}
      isEdit
      onSubmit={handleSubmit}
    />
  );
};

export default ChapterEditPage;