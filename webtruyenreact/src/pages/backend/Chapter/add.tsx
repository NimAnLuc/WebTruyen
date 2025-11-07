  import React, { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import GenericForm from "../../../components/generic/GenericForm.tsx";
  import { useChapterFormConfig } from "../../../config/entityConfigs.tsx";
  import { Chapter } from "../../../types/index.ts";
  import { apiService } from "../../../services/apiService.ts";
  import { toast } from "react-toastify";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

  const ChapterAddPage: React.FC = () => {
    const { chapterFormConfig, loading: configLoading, error: configError } = useChapterFormConfig();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleSubmit = async (data: Chapter) => {
      if (!chapterFormConfig.endpoint) {
        toast.error("Lỗi: Endpoint không được cấu hình!");
        return;
      }

      setIsSubmitting(true);
      try {
        await apiService.create(chapterFormConfig.endpoint, data);
        toast.success("Thêm chapter thành công!");
        navigate("/admin/chapter"); 
      } catch (error: any) {
        // Kiểm tra lỗi cụ thể: Chapter đã tồn tại
        if (error.message === "Chapter đã tồn tại") {
          toast.error("Chapter đã tồn tại, vui lòng kiểm tra lại!");
          // Không điều hướng, giữ nguyên trang
        } else {
          // Lỗi đã được hiển thị bởi apiService, không cần làm gì thêm
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
        <h1>Thêm Chapter</h1>
        <GenericForm
          config={chapterFormConfig}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  };

  export default ChapterAddPage;