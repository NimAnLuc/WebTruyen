import React, { useState, useEffect } from "react";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useUserFormConfig } from "../../../config/entityConfigs.tsx";
import { User } from "../../../types/index";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../services/apiService.ts";

interface ApiResponse<T> {
  status: boolean;
  users: T; 
}

const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userFormConfig } = useUserFormConfig();
  const [initialData, setInitialData] = useState<User | undefined>();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      apiService
        .fetchById<ApiResponse<User>>(userFormConfig.endpoint, id)
        .then((data) => {
          setInitialData(data.users); // Lấy đúng thuộc tính 'users'
        })
        .catch(() => {
          toast.error("Không tìm thấy user!");
        });
    }
  }, [id, userFormConfig.endpoint]);

  const handleSubmit = async (data: User) => {
    if (id) {
      setIsSubmitting(true);
      try {
        await apiService.update(userFormConfig.endpoint, id, data);

        // Lấy user từ localStorage và parse JSON
        const userString = localStorage.getItem("user");
        let currentUser: { id: number | string } | null = null;
        try {
          currentUser = userString ? JSON.parse(userString) : null;
        } catch (e) {
          console.error("Lỗi parse user từ localStorage:", e);
        }
        const isCurrentUser =
          currentUser && currentUser.id && id === currentUser.id.toString();

        toast.success("Cập nhật user thành công!");

        // Kiểm tra nếu người dùng hiện tại sửa chính mình
        if (isCurrentUser) {

          await apiService.logout();
          toast.info("Bạn đã được đăng xuất sau khi cập nhật thông tin.");
          navigate("/admin/login"); // Chuyển hướng về trang đăng nhập
        } else {
          navigate("/admin/user"); // Chuyển hướng về danh sách user
        }
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi cập nhật user!");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div>
      <h1>Chỉnh sửa User</h1>
      <GenericForm
        config={userFormConfig}
        data={initialData}
        isEdit
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default UserEditPage;
