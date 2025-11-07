import React, { useState, useEffect } from "react";
import GenericTrash from "../../../components/generic/GenericTrash.tsx";
import { useComicListConfig } from "../../../config/entityConfigs.tsx";
import { apiService } from "../../../services/apiService.ts";
import { Comic } from "../../../types/index";
import { toast } from "react-toastify";


const ComicTrashPage: React.FC = () => {
  const { comicListConfig} = useComicListConfig();
  const [comics, setComics] = useState<Comic[]>([]);

  useEffect(() => {

    apiService
      .fetchTrash<Comic>(comicListConfig.endpoint)
      .then((data) => {
        setComics((data as any).comics);
      })
      .catch(() => {
        toast.error("Lỗi khi tải danh sách thùng rác!");

      });
  }, [comicListConfig.endpoint]);



  return <GenericTrash config={comicListConfig} data={comics} setData={setComics} />;
};

export default ComicTrashPage;