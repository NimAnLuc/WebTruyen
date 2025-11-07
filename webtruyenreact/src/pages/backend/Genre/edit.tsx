import React, { useState, useEffect } from "react";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useGenreFormConfig } from "../../../config/entityConfigs.tsx";
import { Genre } from "../../../types/index";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../services/apiService.ts";

const GenreEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { genreFormConfig } = useGenreFormConfig();
  const [initialData, setInitialData] = useState<Genre | undefined>();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      apiService
        .fetchById<{genres:Genre}>(genreFormConfig.endpoint, id)
        .then((data) => {
          setInitialData(data.genres); // Giả sử API trả về dữ liệu trong genres
        })
        .catch(() => {
          toast.error("Không tìm thấy genre!");
        });
    }
  }, [id, genreFormConfig.endpoint]);

  const handleSubmit = async (data: Genre) => {
    if (id) {
      setIsSubmitting(true);
      try {
        await apiService.update(genreFormConfig.endpoint, id, data);

        toast.success("Cập nhật genre thành công!");
        navigate("/admin/genre");
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi cập nhật genre!");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div>
      <h1>Chỉnh sửa Genre</h1>
      <GenericForm
        config={genreFormConfig}
        data={initialData}
        isEdit
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default GenreEditPage;
