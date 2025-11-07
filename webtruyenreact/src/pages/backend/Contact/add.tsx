  import React, { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import GenericForm from "../../../components/generic/GenericForm.tsx";
  import { useContactFormConfig } from "../../../config/entityConfigs.tsx";
  import { Contact } from "../../../types/index.ts";
  import { apiService } from "../../../services/apiService.ts";
  import { toast } from "react-toastify";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

  const ContactAddPage: React.FC = () => {
    const { contactFormConfig, loading: configLoading, error: configError } = useContactFormConfig();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleSubmit = async (data: Contact) => {
      if (!contactFormConfig.endpoint) {
        toast.error("Lỗi: Endpoint không được cấu hình!");
        return;
      }

      setIsSubmitting(true);
      try {
        await apiService.create(contactFormConfig.endpoint, data);
        toast.success("Thêm contact thành công!");
        navigate("/admin/contact"); 
      } catch (error: any) {
        // Kiểm tra lỗi cụ thể: Contact đã tồn tại
        if (error.message === "Contact đã tồn tại") {
          toast.error("Contact đã tồn tại, vui lòng kiểm tra lại!");
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
        <h1>Thêm Contact</h1>
        <GenericForm
          config={contactFormConfig}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  };

  export default ContactAddPage;