import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { apiService } from "../../services/apiService.ts";

interface JoinTeamModalProps {
  show: boolean;
  handleClose: () => void;
  teamId: number;
  teamName: string;
}

interface JoinTeamResponse {
  status: boolean;
  message?: string;
}

const JoinTeamModal: React.FC<JoinTeamModalProps> = ({
  show,
  handleClose,
  teamId,
  teamName,
}) => {
  const [requestedRole, setRequestedRole] = useState("translator");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDark = () =>
      setIsDarkMode(document.body.classList.contains("dark-mode"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiService.teamJoin<JoinTeamResponse>({
        team_id: teamId,
        requested_role: requestedRole,
        message,
      });

      if (res.status) {
        toast.success(res.message || "Yêu cầu tham gia nhóm đã được gửi!");
        handleClose();
        setMessage("");
      } else {
        toast.error(res.message || "Gửi yêu cầu thất bại!");
      }
    } catch (err) {
      console.error("JoinTeam error:", err);
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
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
        <Modal.Title>Tham gia nhóm {teamName}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className={isDarkMode ? "dark-body" : ""}>
          <Form.Group className="mb-3">
            <Form.Label>Vai trò mong muốn</Form.Label>
            <Form.Select
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value)}
              required
            >
              <option value="translator">Translator</option>
              <option value="proofreader">Proofreader</option>
              <option value="cleaner">Cleaner</option>

            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label>Lời nhắn</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Bạn có thể giới thiệu đôi chút về bản thân..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className={isDarkMode ? "dark-footer" : ""}>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="d-flex align-items-center"
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
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

export default JoinTeamModal;
