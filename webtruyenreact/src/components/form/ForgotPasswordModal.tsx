import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { apiService } from "../../services/apiService.ts";

interface ForgotPasswordModalProps {
  show: boolean;
  handleClose: () => void;
}

interface ForgotPasswordResponse {
  status: boolean;
  message?: string;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  show,
  handleClose,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 🔄 Theo dõi dark-mode khi body thay đổi (VD: người dùng bật/tắt darkmode ở ngoài)
  useEffect(() => {
    const checkDark = () => {
      setIsDarkMode(document.body.classList.contains("dark-mode"));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiService.forgotPassword<ForgotPasswordResponse>(email);
      if (res.status) {
        toast.success(res.message || "Vui lòng kiểm tra email của bạn!");
        handleClose();
        setEmail("");
      } else {
        toast.error(res.message || "Không thể gửi yêu cầu.");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
      console.error("ForgotPassword error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      backdrop="static"
      contentClassName={isDarkMode ? "dark-modal" : ""}
    >
      <Modal.Header closeButton className={isDarkMode ? "dark-header" : ""}>
        <Modal.Title>Quên mật khẩu</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className={isDarkMode ? "dark-body" : ""}>
          <p className="text-secondary">
            Nhập địa chỉ email của bạn để nhận liên kết đặt lại mật khẩu.
          </p>
          <Form.Group controlId="forgotEmail" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className={isDarkMode ? "dark-footer" : ""}>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Đóng
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="d-flex align-items-center"
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" role="status" className="me-2" />
                Đang gửi...
              </>
            ) : (
              "Gửi yêu cầu"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ForgotPasswordModal;
