import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useUserFormConfig } from "../../../config/entityConfigs.tsx";
import { User } from "../../../types/index.ts";
import { apiService } from "../../../services/apiService.ts";
import { toast } from "react-toastify";

const UserAddPage: React.FC = () => {
  const { userFormConfig } = useUserFormConfig();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: User) => {
    if (!userFormConfig.endpoint) {
      toast.error("Lỗi: Endpoint không được cấu hình!");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.create(userFormConfig.endpoint, data);
      toast.success("Thêm user thành công!");
      navigate("/admin/user");
    } catch (error: any) {
      if (error.message === "User đã tồn tại") {
        toast.error("User đã tồn tại, vui lòng kiểm tra lại!");
      } else {
        toast.error(error.message || "Lỗi khi thêm user!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Thêm User</h1>
      <GenericForm
        config={userFormConfig}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default UserAddPage;
