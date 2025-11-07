import React, { useState, useEffect } from "react";
import GenericTrash from "../../../components/generic/GenericTrash.tsx";
import { useGenreListConfig } from "../../../config/entityConfigs.tsx";
import { apiService } from "../../../services/apiService.ts";
import { Genre } from "../../../types/index";
import { toast } from "react-toastify";


const GenreTrashPage: React.FC = () => {
  const { genreListConfig } = useGenreListConfig();
  const [genres, setGenres] = useState<Genre[]>([]);


  useEffect(() => {

    apiService
      .fetchTrash<Genre>(genreListConfig.endpoint)
      .then((data) => {
        setGenres((data as any).genres);

      })
      .catch(() => {
        toast.error("Lỗi khi tải danh sách thùng rác!");

      });
  }, [genreListConfig.endpoint]);



  return <GenericTrash config={genreListConfig} data={genres} setData={setGenres} />;
};

export default GenreTrashPage;