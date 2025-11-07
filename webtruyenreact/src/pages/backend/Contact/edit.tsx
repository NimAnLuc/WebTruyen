import React, { useState, useEffect } from "react";
import GenericForm from "../../../components/generic/GenericForm.tsx";
import { useContactFormConfig } from "../../../config/entityConfigs.tsx";
import { Contact } from "../../../types/index";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const ContactEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    contactFormConfig,
    loading: configLoading,
    error: configError,
  } = useContactFormConfig();
  const [initialData, setInitialData] = useState<Contact | undefined>();
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setDataLoading(true);
      apiService
        .fetchById<{contacts:Contact}>(contactFormConfig.endpoint, id)
        .then((data) => {
          setInitialData(data.contacts);

          setDataLoading(false);
        })
        .catch(() => {
          setDataError("Không tìm thấy contact!");
          toast.error("Không tìm thấy contact!");
          setDataLoading(false);
        });
    }
  }, [id, contactFormConfig.endpoint]);

  const handleSubmit = async (data: Contact) => {
    if (id) {
      try {
        await apiService.update(contactFormConfig.endpoint, id, data);
        toast.success("Cập nhật contact thành công!");
      } catch (err) {
        // Lỗi đã được xử lý trong apiService (hiển thị toast), không cần làm gì thêm
      }
    }
  };

  if (configLoading || dataLoading) {
    return <LoadingAdmin />;
  }

  if (configError || dataError) {
    return <div>Lỗi: {configError || dataError}</div>;
  }

  return (
    <GenericForm
      config={contactFormConfig}
      data={initialData}
      isEdit
      onSubmit={handleSubmit}
    />
  );
};

export default ContactEditPage;
