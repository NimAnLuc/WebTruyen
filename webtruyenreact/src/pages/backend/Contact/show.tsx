import React from "react";
import GenericShow from "../../../components/generic/GenericShow.tsx";
import { useContactShowConfig } from "../../../config/entityConfigs.tsx";
import { Contact } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const ContactShowPage: React.FC = () => {
  const { contactShowConfig, loading, error } = useContactShowConfig();

  if (loading) {
    return <LoadingAdmin/>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  return (
    <GenericShow
      config={contactShowConfig}
      fetchData={(id) => apiService.fetchById<Contact>(contactShowConfig.endpoint, id)}
    />
  );
};

export default ContactShowPage;