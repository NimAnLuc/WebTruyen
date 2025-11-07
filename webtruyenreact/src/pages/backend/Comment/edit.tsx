import React, { useState, useEffect } from "react";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useCommentFormConfig } from "../../../config/entityConfigs.tsx";
import { Comment } from "../../../types/index";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const CommentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<Comment | undefined>();
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    commentFormConfig,
    loading: configLoading,
    error: configError,
  } = useCommentFormConfig({
    currentCommentId: id ? parseInt(id) : undefined,
  });

  useEffect(() => {
    if (id) {
      setDataLoading(true);
      apiService
        .fetchById<{comments:Comment}>(commentFormConfig.endpoint, id)
        .then((data) => {
          setInitialData(data.comments); // Giả sử API trả về dữ liệu trong comments
          setDataLoading(false);
        })
        .catch(() => {
          setDataError("Không tìm thấy comment!");
          toast.error("Không tìm thấy comment!");
          setDataLoading(false);
        });
    }
  }, [id, commentFormConfig.endpoint]);

  const handleSubmit = async (data: Comment) => {
    if (id) {
      setIsSubmitting(true);
      try {
        await apiService.update(commentFormConfig.endpoint, id, data);
        toast.success("Cập nhật comment thành công!");
        navigate("/admin/comment");
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi cập nhật comment!");
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
      <h1>Chỉnh sửa Comment</h1>
      <GenericForm
        config={commentFormConfig}
        data={initialData}
        isEdit
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default CommentEditPage;