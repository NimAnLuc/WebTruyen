import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select"; // Thêm import react-select
import { EntityConfig, FieldConfig } from "../../types/index";
import { apiService } from "../../services/apiService.ts";
import LoadingAdmin from "../Loading/loadingadmin.tsx";
import AsyncSelect from "react-select/async";
import { Button, Spinner } from "react-bootstrap";

interface GenericFormProps<T> {
  config: EntityConfig<T>;
  data?: T;
  isEdit?: boolean;
  onSubmit: (data: T) => void;
  isSubmitting?: boolean;
}

const GenericForm = <T extends { id?: number }>({
  config,
  data,
  isEdit = false,
  onSubmit,
  isSubmitting = false,
}: GenericFormProps<T>) => {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<Partial<T>>(data || {});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("");
  type OptionType = { value: number; label: string };
  const [options, setOptions] = useState<OptionType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  useEffect(() => {
    if (isEdit && id && !data) {
      setIsLoading(true);
      const fetchData = async () => {
        try {
          const response = await apiService.fetchById<T>(config.endpoint, id);
          setFormData(response);
        } catch (error: any) {
          toast.error(
            `Lỗi khi tải dữ liệu ${config.entityName.toLowerCase()}: ${
              error.message || "Không xác định"
            }`
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else if (data) {
      setFormData(data);
    }
  }, [id, isEdit, config.endpoint, config.entityName, data]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    key: keyof T,
    isMultiSelect: boolean = false
  ) => {
    const field = config.fields.find((f) => f.key === key);
    if (field?.disabled) return;

    if (isMultiSelect) {
      const { value, checked } = e.target as HTMLInputElement;
      const currentValues = (formData[key] as any[] | undefined) || [];
      let updatedValues: any[];
      if (checked) {
        updatedValues = [...currentValues, Number(value)];
      } else {
        updatedValues = currentValues.filter((v) => v !== Number(value));
      }
      setFormData((prev) => ({ ...prev, [key]: updatedValues }));
    } else {
      let value: any;
      if (field?.type === "file") {
        const inputEvent = e as React.ChangeEvent<HTMLInputElement>;
        value = inputEvent.target.files?.[0] || undefined;
      } else if (field?.type === "number") {
        value = e.target.value === "" ? undefined : Number(e.target.value);
      } else {
        value = e.target.value;
      }
      setFormData((prev) => ({ ...prev, [key]: value }));
    }
  };

  // Hàm xử lý thay đổi giá trị của react-select
  const handleSelectChange = (option: any, key: keyof T) => {
    const field = config.fields.find((f) => f.key === key);
    if (field?.disabled) return;

    const value = option ? option.value : "";
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate các field required
    const requiredFields = config.fields.filter(
      (f) =>
        (typeof f.required === "function"
          ? f.required(formData)
          : f.required) && !f.disabled
    );
    for (const field of requiredFields) {
      const value = formData[field.key];
      if (
        value == null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        // Bỏ qua kiểm tra mật khẩu nếu đang chỉnh sửa
        if (field.key === "password" && isEdit) continue;
        toast.error(`Vui lòng nhập ${field.label.toLowerCase()}`);
        return;
      }
    }
    const submitData = { ...formData };

    const fileFields = config.fields.filter((f) => f.type === "file");

    for (const field of fileFields) {
      const file = formData[field.key];
      if (file instanceof File) {
        // Upload lên Cloudinary
        const formDataCloud = new FormData();
        formDataCloud.append("file", file);
        formDataCloud.append("upload_preset", "uploadcomics"); // preset unsigned
        formDataCloud.append("folder", config.endpoint);

        try {
          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formDataCloud }
          );
          const data = await res.json();

          if (data.secure_url) {
            submitData[field.key] = data.secure_url;
          } else {
            toast.error(`Upload ảnh ${field.label} thất bại`);
            console.error("Cloudinary error:", data);
            return;
          }
        } catch (err) {
          console.error("Upload error:", err);
          toast.error(`Lỗi khi upload ảnh ${field.label}`);
          return;
        }
      } else if (isEdit && !(file instanceof File)) {
        // Nếu edit mà không đổi file, bỏ qua
        delete submitData[field.key];
      }
    }
    // Loại bỏ password nếu trống khi chỉnh sửa
    if ("password" in submitData && submitData.password === "") {
      delete submitData.password;
    }
    onSubmit(submitData as T);
  };
  const getInputValue = (field: FieldConfig<T>) => {
    const value = formData[field.key];
    if (field.type === "file" || field.type === "password") return undefined;
    if (value == null) return "";
    return field.type === "number" ? String(value) : value;
  };

  return (
    <div className="container-fluid entity-form-container">
      <style>
        {`
            .checkbox-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 0.5rem;
              margin-top: 0.5rem;
            }
            .entity-form-container {
              padding: 2rem;
              background-color: #f4f7fa;
              min-height: 100vh;
            }
            .card {
              border: none;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            }
            .card-title {
              font-size: 1.5rem;
              font-weight: 600;
              color: #2c3e50;
            }
            .form-control, .form-select {
              border-radius: 8px;
              padding: 0.75rem;
              border: 1px solid #ced4da;
            }
            .form-control:focus, .form-select:focus {
              border-color: #3498db;
              box-shadow: 0 0 8px rgba(52, 152, 219, 0.3);
            }
            .btn {
              border-radius: 8px;
              padding: 0.5rem 1rem;
              font-weight: 500;
            }
            .btn-secondary {
              background-color: #6c757d;
              border-color: #6c757d;
            }
            .btn-primary {
              background-color: #3498db;
              border-color: #3498db;
            }
            .breadcrumb {
              background-color: transparent;
              padding: 0.5rem 0;
            }
            .breadcrumb-item a {
              color: #3498db;
              text-decoration: none;
            }
            .form-control:disabled, .form-select:disabled {
              background-color: #e9ecef;
              opacity: 1;
            }
            .react-select-container {
              border-radius: 8px;
            }
            .react-select__control {
              border: 1px solid #ced4da;
              border-radius: 8px;
              padding: 0.25rem;
            }
            .react-select__control--is-focused {
              border-color: #3498db !important;
              box-shadow: 0 0 8px rgba(52, 152, 219, 0.3) !important;
            }
          `}
      </style>

      {isLoading && <LoadingAdmin />}

      {!isLoading && (
        <div className="row">
          <div className="col-12 bg-white p-4 rounded card">
            <div className="card-body p-0">
              <div aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/">Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to={`/admin/${config.entityName.toLowerCase()}`}>
                      Quản lý {config.entityName}
                    </Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {isEdit ? "Chỉnh sửa" : "Thêm"} {config.entityName}
                  </li>
                </ol>
              </div>
            </div>

            <div className="card shadow rounded">
              <div className="card-body">
                <h2 className="card-title mb-4">
                  {isEdit ? "Chỉnh sửa" : "Thêm"} {config.entityName}
                </h2>
                <form onSubmit={handleSubmit}>
                  {config.fields.map((field) => (
                    <div className="mb-3" key={String(field.key)}>
                      <label className="form-label">{field.label}</label>
                      {field.type === "file" ? (
                        <div>
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            disabled={isSubmitting || field.disabled}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const allowedTypes = [
                                "image/jpeg",
                                "image/pjpeg",
                                "image/png",
                                "image/webp",
                                "image/gif",
                                "image/svg+xml",
                                "image/x-icon",
                                "image/bmp",
                                "image/tiff",
                              ];
                              if (!allowedTypes.includes(file.type)) {
                                toast.error(
                                  "Chỉ cho phép upload file ảnh (JPEG, PNG, WEBP, GIF)"
                                );
                                return;
                              }

                              // ✅ Giới hạn kích thước file (ví dụ < 2MB)
                              if (file.size > 2 * 1024 * 1024) {
                                toast.error("Kích thước ảnh vượt quá 2MB");
                                return;
                              }

                              // Chỉ preview tạm
                              const previewUrl = URL.createObjectURL(file);
                              setPreview(previewUrl);
                              setFormData((prev) => ({
                                ...prev,
                                [field.key]: file,
                              }));
                            }}
                          />
                          {/* Hiển thị preview */}
                          {preview && (
                            <div className="mt-2">
                              <p>Ảnh tạm:</p>
                              <img
                                src={preview}
                                alt="Preview"
                                style={{
                                  maxWidth: "200px",
                                  borderRadius: "8px",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : field.type === "select" && field.async ? (
                        //danh rieng cho page thui
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ flex: 1 }}>
                            <AsyncSelect
                              className="react-select-container"
                              classNamePrefix="react-select"
                              cacheOptions
                              defaultOptions={options} // danh sách sau khi tìm
                              loadOptions={async () => []} // ❌ không tự fetch khi gõ
                              inputValue={inputValue}
                              onInputChange={(value, { action }) => {
                                if (action === "input-change")
                                  setInputValue(value);
                              }}
                              options={options}
                              isLoading={isLoading}
                              value={
                                field.options?.find(
                                  (option) =>
                                    option.value === formData[field.key]
                                ) || null
                              }
                              onChange={(option) =>
                                handleSelectChange(option, field.key)
                              }
                              isDisabled={isSubmitting || field.disabled}
                              placeholder={`Nhập tên truyện hoặc số chương (vd: One Piece 1090) rồi bấm "Tìm"`}
                            />
                          </div>

                          {/* ✅ Nút bấm tìm */}
                          <Button
                            variant="primary"
                            disabled={isSearching || !inputValue.trim()}
                            onClick={async () => {
                              setIsSearching(true);
                              try {
                                const response =
                                  (await apiService.fetchChapterSearch({
                                    keyword: inputValue || "",
                                  })) as {
                                    chapters: {
                                      id: number;
                                      comic_title: string;
                                      title: string;
                                      chapter_number: number;
                                    }[];
                                  };
                                const resultOptions = response.chapters.map(
                                  (c) => ({
                                    value: c.id,
                                    label: `${c.comic_title} - ${c.title}`,
                                  })
                                );
                                setOptions(resultOptions);
                                toast.success("Tìm kiếm thành công!");
                              } catch (error) {
                                console.error(error);
                                toast.error("Lỗi khi tìm kiếm chương!");
                                setOptions([]);
                              } finally {
                                setIsSearching(false);
                              }
                            }}
                          >
                            {isSearching ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  className="me-1"
                                />
                                Đang tìm...
                              </>
                            ) : (
                              "Tìm"
                            )}
                          </Button>
                        </div>
                      ) : field.type === "select" ? (
                        <Select
                          className="react-select-container"
                          classNamePrefix="react-select"
                          options={field.options}
                          value={field.options?.find(
                            (option) => option.value === formData[field.key]
                          )}
                          onChange={(option) =>
                            handleSelectChange(option, field.key)
                          }
                          isDisabled={isSubmitting || field.disabled}
                          placeholder={`Chọn ${field.label.toLowerCase()}`}
                          isClearable
                          isSearchable
                        />
                      ) : field.type === "textarea" ? (
                        <textarea
                          className="form-control"
                          value={getInputValue(field) as string}
                          onChange={(e) => handleChange(e, field.key)}
                          disabled={isSubmitting || field.disabled}
                        />
                      ) : field.type === "multi-select" ? (
                        <div className="checkbox-grid">
                          {field.options?.map((option) => (
                            <div key={option.value} className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                value={option.value}
                                checked={
                                  (
                                    formData[field.key] as any[] | undefined
                                  )?.includes(option.value) || false
                                }
                                onChange={(e) =>
                                  handleChange(e, field.key, true)
                                }
                                disabled={isSubmitting || field.disabled}
                              />
                              <label className="form-check-label">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          className="form-control"
                          value={getInputValue(field) as string}
                          onChange={(e) => handleChange(e, field.key)}
                          required={
                            typeof field.required === "function"
                              ? field.required(formData)
                              : field.required &&
                                !(field.key === "password" && isEdit)
                          }
                          disabled={isSubmitting || field.disabled}
                        />
                      )}
                    </div>
                  ))}
                  <div className="d-flex gap-2">
                    <Link to={`/admin/${config.entityName.toLowerCase()}`}>
                      <button type="button" className="btn btn-secondary">
                        <FaArrowLeft className="me-1" /> Quay lại
                      </button>
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      <FaSave className="me-1" />{" "}
                      {isSubmitting ? "Đang lưu..." : "Lưu"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericForm;
