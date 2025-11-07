import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { usePageFormConfig } from "../../../config/entityConfigs.tsx";
import { Page } from "../../../types/index.ts";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const PageAddPage: React.FC = () => {
  const {
    pageFormConfig,
    loading: configLoading,
    error: configError,
  } = usePageFormConfig();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: Page) => {
    if (!pageFormConfig.endpoint) {
      toast.error("Lỗi: Endpoint không được cấu hình!");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.create(pageFormConfig.endpoint, data);
      toast.success("Thêm page thành công!");
      navigate("/admin/page");
    } catch (error: any) {
      if (error.message === "Page đã tồn tại") {
        toast.error("Page đã tồn tại, vui lòng kiểm tra lại!");
      } else {
        toast.error(error.message || "Lỗi khi thêm page!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (configLoading) {
    return <LoadingAdmin/>;
  }

  if (configError) {
    return <div>Lỗi: {configError}</div>;
  }

  return (
    <div>
      <h1>Thêm Page</h1>
      <GenericForm
        config={pageFormConfig}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default PageAddPage;
