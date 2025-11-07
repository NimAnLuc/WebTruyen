import React from "react";
import GenericList from "../../../components/generic/GenericList.tsx";
import { useUserListConfig } from "../../../config/entityConfigs.tsx";
import { User } from "../../../types/index";

const UserListPage: React.FC = () => {
  const { userListConfig } = useUserListConfig();

  

  return <GenericList<User> config={userListConfig} />;
};

export default UserListPage;