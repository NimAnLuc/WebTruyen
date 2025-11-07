import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EntityConfig } from "../../types/index";
import LoadingAdmin from "../Loading/loadingadmin.tsx";

interface GenericShowProps<T> {
  config: EntityConfig<T> & { loading?: boolean; error?: string | null };
  fetchData: (id: string) => Promise<T | null>;
}

const GenericShow = <T extends { id: number }>({
  config,
  fetchData,
}: GenericShowProps<T>) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setFetchError("ID không hợp lệ");
      toast.error("ID không hợp lệ!");
      navigate(`/admin/${config.entityName.toLowerCase()}`);
      return;
    }
    function hasRecordShape(x: unknown): x is Record<string, unknown> {
      return typeof x === "object" && x !== null;
    }
    setLoading(true);
    setFetchError(null);
    fetchData(id)
      .then((response) => {
        if (response && (response as any).status) {
          const entityName = config.endpoint.toLowerCase();
          if (hasRecordShape(response) && entityName in response) {
            const result = (response as Record<string, unknown>)[
              entityName
            ] as T;
            setData(result);
          } else {
            throw new Error(`Không tìm thấy ${entityName}!`);
          }
        }
      })
      .catch((err) => {
        const message = err.message || "Lỗi khi tải dữ liệu";
        setFetchError(message);
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, navigate, config.entityName, fetchData, config.endpoint]);

  const totalLoading = loading || (config.loading ?? false);
  const totalError = fetchError || config.error;

  if (totalLoading) {
    return <LoadingAdmin />;
  }

  if (totalError || !data) {
    return (
      <div className="container-fluid entity-show-container">
        <div className="alert alert-danger">
          {totalError || `Không tìm thấy ${config.entityName.toLowerCase()}!`}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid entity-show-container">
      <style>
        {`
          .entity-show-container {
            padding: 2rem;
            background-color: #f4f7fa;
            min-height: 100vh;
          }

          .card {
            border: none;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
          }

          .card:hover {
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
          }

          .card-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2c3e50;
          }

          .btn {
            border-radius: 8px;
            padding: 0.5rem 1rem;
            font-weight: 500;
            transition: all 0.3s ease;
          }

          .btn-secondary {
            background-color: #6c757d;
            border-color: #6c757d;
          }

          .btn-secondary:hover {
            background-color: #5a6268;
            transform: translateY(-2px);
          }

          .btn-primary {
            background-color: #3498db;
            border-color: #3498db;
          }

          .btn-primary:hover {
            background-color: #2980b9;
            transform: translateY(-2px);
          }

          .breadcrumb {
            background-color: transparent;
            padding: 0.5rem 0;
          }

          .breadcrumb-item a {
            color: #3498db;
            text-decoration: none;
          }

          .breadcrumb-item a:hover {
            text-decoration: underline;
          }

          .detail-container {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .detail-item {
            flex: 1 1 calc(50% - 1rem); /* Hai cột trên màn hình lớn */
            min-width: 250px; /* Chiều rộng tối thiểu */
            padding: 0.5rem;
            box-sizing: border-box;
          }

          @media (max-width: 768px) {
            .detail-item {
              flex: 1 1 100%; /* Một cột trên màn hình nhỏ */
            }
          }

          .detail-label {
            font-weight: 500;
            color: #2c3e50;
            margin-bottom: 0.25rem;
          }

          .detail-value {
            color: #495057;
            word-break: break-word; /* Xuống dòng nếu nội dung dài */
          }

          .badge {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 500;
          }

          .bg-success {
            background-color: #28a745;
            color: white;
          }

          .bg-warning {
            background-color: #f39c12;
            color: white;
          }

          .cover-image {
            max-width: 150px;
            height: auto;
            border-radius: 8px;
          }
        `}
      </style>

      <div className="row">
        <div className="col-12 bg-white p-4 rounded card">
          <div className="card-body p-0">
            <nav aria-label="breadcrumb">
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
                  Chi tiết {config.entityName}
                </li>
              </ol>
            </nav>
          </div>

          <div className="card shadow rounded">
            <div className="card-body">
              <h2 className="card-title mb-4">Chi tiết {config.entityName}</h2>
              <div className="detail-container">
                {config.fields.map((field) => (
                  <div className="detail-item" key={String(field.key)}>
                    <div className="detail-label">{field.label}:</div>
                    <div className="detail-value">
                      {field.render
                        ? field.render(data[field.key], data)
                        : String(data[field.key])}
                    </div>
                  </div>
                ))}
                {config.statusField && config.statusLabels && (
                  <div className="detail-item">
                    <div className="detail-label">Trạng thái:</div>
                    <div className="detail-value">
                      <span
                        className={`badge ${
                          data[config.statusField] === 1
                            ? "bg-success"
                            : "bg-warning"
                        }`}
                      >
                        {
                          config.statusLabels[
                            data[config.statusField] as number
                          ]
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="d-flex gap-2 mt-4">
                <Link to={`/admin/${config.entityName.toLowerCase()}`}>
                  <button type="button" className="btn btn-secondary">
                    <FaArrowLeft className="me-1" /> Quay lại
                  </button>
                </Link>
                <Link
                  to={`/admin/${config.entityName.toLowerCase()}/edit/${
                    data.id
                  }`}
                >
                  <button type="button" className="btn btn-primary">
                    <FaSave className="me-1" /> Sửa
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericShow;
