import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useComicFormConfig } from "../../../config/entityConfigs.tsx";
import { Comic } from "../../../types/index.ts";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const ComicAddPage: React.FC = () => {
  const {
    comicFormConfig,
    loading: configLoading,
    error: configError,
  } = useComicFormConfig();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: Comic) => {
    if (!comicFormConfig.endpoint) {
      toast.error("Lỗi: Endpoint không được cấu hình!");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.create(comicFormConfig.endpoint, data);
      toast.success("Thêm comic thành công!");
      navigate("/admin/comic");
    } catch (error: any) {
      if (error.message === "Comic đã tồn tại") {
        toast.error("Comic đã tồn tại, vui lòng kiểm tra lại!");
      } else {
        toast.error(error.message || "Lỗi khi thêm comic!");
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
      <h1>Thêm Comic</h1>
      <GenericForm
        config={comicFormConfig}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ComicAddPage;
