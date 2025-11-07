import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useBookmarkFormConfig } from "../../../config/entityConfigs.tsx";
import { Bookmark } from "../../../types/index.ts";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const BookmarkAddPage: React.FC = () => {
  const { bookmarkFormConfig, loading: configLoading, error: configError } = useBookmarkFormConfig();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: Bookmark) => {
    if (!bookmarkFormConfig.endpoint) {
      toast.error("Lỗi: Endpoint không được cấu hình!");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.create(bookmarkFormConfig.endpoint, data);
      toast.success("Thêm bookmark thành công!");
      navigate("/admin/bookmark"); 
    } catch (error: any) {
      // Kiểm tra lỗi cụ thể: Bookmark đã tồn tại
      if (error.message === "Bookmark đã tồn tại") {
        toast.error("Bookmark đã tồn tại, vui lòng kiểm tra lại!");
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
      <h1>Thêm Bookmark</h1>
      <GenericForm
        config={bookmarkFormConfig}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default BookmarkAddPage;