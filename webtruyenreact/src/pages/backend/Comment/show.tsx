import React from "react";
import GenericShow from "../../../components/generic/GenericShow.tsx";
import { useCommentShowConfig } from "../../../config/entityConfigs.tsx";
import { Comment } from "../../../types/index";
import { apiService } from "../../../services/apiService.ts";

const CommentShowPage: React.FC = () => {
  const { commentShowConfig } = useCommentShowConfig();


  return (
    <GenericShow
      config={commentShowConfig}
      fetchData={(id) => apiService.fetchById<Comment>(commentShowConfig.endpoint, id)}
    />
  );
};

export default CommentShowPage;