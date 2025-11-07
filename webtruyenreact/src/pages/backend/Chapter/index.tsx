import React from "react";
import GenericList from "../../../components/generic/GenericList.tsx";
import { useChapterListConfig } from "../../../config/entityConfigs.tsx";
import { Chapter } from "../../../types/index";


const ChapterListPage: React.FC = () => {
  const { chapterListConfig } = useChapterListConfig();

 

  return <GenericList<Chapter> config={chapterListConfig} />;
};

export default ChapterListPage;