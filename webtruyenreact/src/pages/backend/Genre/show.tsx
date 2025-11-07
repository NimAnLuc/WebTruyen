import React from "react";
import GenericShow from "../../../components/generic/GenericShow.tsx";
import { useGenreShowConfig } from "../../../config/entityConfigs.tsx";
import { Genre } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";
import LoadingAdmin from "../../../components/Loading/loadingadmin.tsx";

const GenreShowPage: React.FC = () => {
  const { genreShowConfig, loading, error } = useGenreShowConfig();

  if (loading) {
    return <LoadingAdmin/>;
  }

  if (error) {
    return <div>Lỗi: {error}</div>;
  }

  return (
    <GenericShow
      config={genreShowConfig}
      fetchData={(id) => apiService.fetchById<Genre>(genreShowConfig.endpoint, id)}
    />
  );
};

export default GenreShowPage;