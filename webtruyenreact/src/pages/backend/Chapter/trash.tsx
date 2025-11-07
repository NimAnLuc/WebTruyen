import React, { useState, useEffect } from "react";
import GenericTrash from "../../../components/generic/GenericTrash.tsx";
import { useChapterListConfig } from "../../../config/entityConfigs.tsx";
import { apiService } from "../../../services/apiService.ts";
import { Chapter } from "../../../types/index";
import { toast } from "react-toastify";

const ChapterTrashPage: React.FC = () => {
  const { chapterListConfig } = useChapterListConfig();
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    apiService
      .fetchTrash<Chapter>(chapterListConfig.endpoint)
      .then((data) => {
        setChapters((data as any).chapters);
      })
      .catch(() => {
        toast.error("Lỗi khi tải");
      });
  }, [chapterListConfig.endpoint]);

  return (
    <GenericTrash
      config={chapterListConfig}
      data={chapters}
      setData={setChapters}
    />
  );
};

export default ChapterTrashPage;
