import React from "react";
import GenericList from "../../../components/generic/GenericList.tsx";
import { useComicListConfig } from "../../../config/entityConfigs.tsx";
import { Comic } from "../../../types/index";

const ComicListPage: React.FC = () => {
  const { comicListConfig } = useComicListConfig();

  return <GenericList<Comic> config={comicListConfig} />;
};

export default ComicListPage;