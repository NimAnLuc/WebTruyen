import React, { useState, useEffect } from "react";
import GenericTrash from "../../../components/generic/GenericTrash.tsx";
import { useContactListConfig } from "../../../config/entityConfigs.tsx";
import { apiService } from "../../../services/apiService.ts";
import { Contact } from "../../../types/index";
import { toast } from "react-toastify";



const ContactTrashPage: React.FC = () => {
  const { contactListConfig } = useContactListConfig();
  const [contacts, setContacts] = useState<Contact[]>([]);


  useEffect(() => {

    apiService
      .fetchTrash<Contact>(contactListConfig.endpoint)
      .then((data) => {
        setContacts((data as any).contacts);

      })
      .catch(() => {
        toast.error("Lỗi khi tải danh sách thùng rác!");

      });
  }, [contactListConfig.endpoint]);



  return <GenericTrash config={contactListConfig} data={contacts} setData={setContacts} />;
};

export default ContactTrashPage;