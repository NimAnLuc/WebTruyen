import React, { useState, useEffect } from "react";
import GenericTrash from "../../../components/generic/GenericTrash.tsx";
import { useUserListConfig } from "../../../config/entityConfigs.tsx";
import { apiService } from "../../../services/apiService.ts";
import { User } from "../../../types/index";
import { toast } from "react-toastify";


const UserTrashPage: React.FC = () => {
  const { userListConfig} = useUserListConfig();
  const [users, setUsers] = useState<User[]>([]);


  useEffect(() => {

    apiService
      .fetchTrash<User>(userListConfig.endpoint)
      .then((data) => {
        setUsers((data as any).users);

      })
      .catch(() => {
        toast.error("Lỗi khi tải danh sách thùng rác!");
     
      });
  }, [userListConfig.endpoint]);



  return <GenericTrash config={userListConfig} data={users} setData={setUsers} />;
};

export default UserTrashPage;