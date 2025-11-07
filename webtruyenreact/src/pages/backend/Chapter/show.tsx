import React from "react";
import GenericShow from "../../../components/generic/GenericShow.tsx";
import { useChapterShowConfig } from "../../../config/entityConfigs.tsx";
import { Chapter } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";

const ChapterShowPage: React.FC = () => {
  const { chapterShowConfig } = useChapterShowConfig();



  return (
    <GenericShow
      config={chapterShowConfig}
      fetchData={(id) => apiService.fetchById<Chapter>(chapterShowConfig.endpoint, id)}
    />
  );
};

export default ChapterShowPage;