import React from "react";
import GenericList from "../../../components/generic/GenericList.tsx";
import SimpleList from "../../../components/generic/SimpleList.tsx";
import { useGenreListConfig } from "../../../config/entityConfigs.tsx";
import { Genre } from "../../../types/index";

const GenreListPage: React.FC = () => {
  const { genreListConfig } = useGenreListConfig();
  
  // Lấy thông tin user từ localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role || ""; // Lấy role, mặc định là chuỗi rỗng nếu không có


  return userRole === "team" ? (
    <SimpleList<Genre> config={genreListConfig} />
  ) : (
    <GenericList<Genre> config={genreListConfig} />
  );
};

export default GenreListPage;