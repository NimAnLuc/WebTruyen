import React from "react";
import SimpleList from "../../../components/generic/SimpleList.tsx";
import { useCommentListConfig } from "../../../config/entityConfigs.tsx";
import { Comment } from "../../../types/index";

const CommentListPage: React.FC = () => {
  const { commentListConfig } = useCommentListConfig();


  return <SimpleList<Comment> config={commentListConfig} />;
};

export default CommentListPage;