import React from "react";
import GenericShow from "../../../components/generic/GenericShow.tsx";
import { useComicShowConfig } from "../../../config/entityConfigs.tsx";
import { Comic } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";

const ComicShowPage: React.FC = () => {
  const { comicShowConfig } = useComicShowConfig();

  return (
    <GenericShow
      config={comicShowConfig}
      fetchData={(id) => apiService.fetchById<Comic>(comicShowConfig.endpoint, id)}
    />
  );
};

export default ComicShowPage;