import React, { useState, useEffect } from "react";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useComicFormConfig } from "../../../config/entityConfigs.tsx";
import { Comic } from "../../../types/index";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const ComicEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    comicFormConfig,
    loading: configLoading,
    error: configError,
  } = useComicFormConfig();
  const [initialData, setInitialData] = useState<Comic | undefined>();
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setDataLoading(true);
      apiService
        .fetchById<{ comics: Comic }>(comicFormConfig.endpoint, id)
        .then((data) => {
          setInitialData(data.comics); // Giả sử API trả về dữ liệu trong comics
          setDataLoading(false);
        })
        .catch(() => {
          setDataError("Không tìm thấy comic!");
          toast.error("Không tìm thấy comic!");
          setDataLoading(false);
        });
    }
  }, [id, comicFormConfig.endpoint]);

  const handleSubmit = async (data: Comic) => {
    if (id) {
      setIsSubmitting(true);
      try {
        await apiService.update(comicFormConfig.endpoint, id, data);

        toast.success("Cập nhật comic thành công!");
        navigate("/admin/comic");
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi cập nhật comic!");
      } finally {
        setIsSubmitting(false);
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
    <div>
      <h1>Chỉnh sửa Comic</h1>
      <GenericForm
        config={comicFormConfig}
        data={initialData}
        isEdit
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ComicEditPage;
