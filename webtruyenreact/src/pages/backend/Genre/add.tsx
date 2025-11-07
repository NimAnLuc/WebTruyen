import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useGenreFormConfig } from "../../../config/entityConfigs.tsx";
import { Genre } from "../../../types/index.ts";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";

const GenreAddPage: React.FC = () => {
  const {
    genreFormConfig,

  } = useGenreFormConfig();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: Genre) => {
    if (!genreFormConfig.endpoint) {
      toast.error("Lỗi: Endpoint không được cấu hình!");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.create(genreFormConfig.endpoint, data);
      toast.success("Thêm genre thành công!");
      navigate("/admin/genre");
    } catch (error: any) {
      if (error.message === "Genre đã tồn tại") {
        toast.error("Genre đã tồn tại, vui lòng kiểm tra lại!");
      } else {
        toast.error(error.message || "Lỗi khi thêm genre!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div>
      <h1>Thêm Genre</h1>
      <GenericForm
        config={genreFormConfig}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default GenreAddPage;
