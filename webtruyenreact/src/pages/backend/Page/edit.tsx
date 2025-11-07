import React, { useState, useEffect } from "react";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { usePageFormConfig } from "../../../config/entityConfigs.tsx";
import { Page } from "../../../types/index";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const PageEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    pageFormConfig,
    loading: configLoading,
    error: configError,
  } = usePageFormConfig();
  const [initialData, setInitialData] = useState<Page | undefined>();
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setDataLoading(true);
      apiService
        .fetchById<{pages:Page}>(pageFormConfig.endpoint, id)
        .then((data) => {
          setInitialData(data.pages); // Giả sử API trả về dữ liệu trong pages
          setDataLoading(false);
        })
        .catch(() => {
          setDataError("Không tìm thấy page!");
          toast.error("Không tìm thấy page!");
          setDataLoading(false);
        });
    }
  }, [id, pageFormConfig.endpoint]);

  const handleSubmit = async (data: Page) => {
    if (id) {
      setIsSubmitting(true);
      try {
        await apiService.update(pageFormConfig.endpoint, id, data);

        toast.success("Cập nhật page thành công!");
        navigate("/admin/page");
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi cập nhật page!");
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
      <h1>Chỉnh sửa Page</h1>
      <GenericForm
        config={pageFormConfig}
        data={initialData}
        isEdit
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default PageEditPage;
