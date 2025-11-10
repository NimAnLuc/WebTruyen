import React, { useEffect, useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { toast } from "react-toastify";

interface AutoScrollControlProps {
  autoScroll: boolean;
  setAutoScroll: (value: boolean) => void;
  scrollSpeed: number;
  setScrollSpeed: (value: number) => void;
  handleNextChapter: () => boolean; // hàm trả về true nếu là chương cuối
}

const AutoScrollControl: React.FC<AutoScrollControlProps> = ({
  autoScroll,
  setAutoScroll,
  scrollSpeed,
  setScrollSpeed,
  handleNextChapter,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Khoảng thời gian giữa các lần cuộn (ms).
  // Mặc định lấy "Bình thường" = 5ms
  const [scrollInterval, setScrollInterval] = useState<number>(5);

  useEffect(() => {
    if (!autoScroll) return;

    let intervalId: number | null = null;

    const startScrolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }

      intervalId = window.setInterval(() => {
        // cuộn theo pixels mỗi lần
        window.scrollBy(0, scrollSpeed);

        // kiểm tra tới đáy trang (thêm khoảng dung sai)
        if (
          window.innerHeight + window.scrollY >=
          document.body.scrollHeight - 5
        ) {
          if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
          setAutoScroll(false);

          // chờ 1.5s trước khi chuyển chương
          setTimeout(() => {
            const isLastChapter = handleNextChapter();
            if (!isLastChapter) {
              // nếu còn chương mới thì tiếp tục autoScroll
              setAutoScroll(true);
            }
          }, 1500);
        }
      }, scrollInterval);
    };

    startScrolling();

    return () => {
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [
    autoScroll,
    scrollSpeed,
    scrollInterval,
    handleNextChapter,
    setAutoScroll,
  ]);

  useEffect(() => {
    if (!showModal) {
      // Delay 200ms cho animation fade out
      const timeout = setTimeout(() => {
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        document.body.removeAttribute("data-rr-ui-modal-open");
      }, 200);

      return () => clearTimeout(timeout);
    }
  }, [showModal]);

  // các preset interval theo yêu cầu
  const applyPreset = (preset: "slow" | "normal" | "fast" | "veryfast") => {
    switch (preset) {
      case "slow":
        setScrollInterval(10);
        setScrollSpeed(1);
        toast.info("Chế độ: Chậm — đọc chữ (1px/10ms)");
        break;
      case "normal":
        setScrollInterval(5);
        setScrollSpeed(1);
        toast.info(
          "Chế độ: Bình thường — tốc độ vừa xem ảnh vừa đọc chữ (1px/5ms)"
        );
        break;
      case "fast":
        setScrollInterval(10);
        setScrollSpeed(5);
        toast.info("Chế độ: Nhanh — xem ảnh và đọc chữ ít (5px/10ms)");
        break;
      case "veryfast":
        setScrollInterval(10);
        setScrollSpeed(10);
        toast.info("Chế độ: Rất nhanh — chỉ xem ảnh (10px/10ms)");
        break;
    }
    setShowModal(false);
  };

  return (
    <div className="auto-scroll-control">
      <Button
        className="auto-scroll-btn"
        variant={autoScroll ? "success" : "outline-success"}
        onClick={() => setShowModal(true)}
        title="Chế độ tự cuộn"
      >
        <i className={autoScroll ? "fas fa-pause" : "fas fa-play"}></i>
      </Button>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header
          closeButton
          className="bg-dark text-white border-secondary"
        >
          <Modal.Title className="text-success">⚙️ Cài đặt tự cuộn</Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-dark text-white">
          <Form.Group className="mb-3">
            <Form.Label className="text-info">
              Tốc độ cuộn: <b>{scrollSpeed}px / lần cuộn</b>
            </Form.Label>
            <small>
              <ul className="mb-0">
                <li>Chậm — đọc chữ: 1px/10ms</li>
                <li>Bình thường — vừa xem ảnh vừa đọc chữ: 1px/5ms</li>
                <li>Nhanh — xem ảnh & đọc chữ ít: 5px/10ms</li>
                <li>Rất nhanh — chỉ xem ảnh: 10px/10ms</li>
              </ul>
            </small>
          </Form.Group>

          {/* Thêm preset tốc độ cho tiện */}
          <div className="speed-presets d-flex gap-2 mb-3 flex-wrap">
            <Button
              variant="outline-info"
              size="sm"
              onClick={() => applyPreset("slow")}
            >
              Chậm
            </Button>
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => applyPreset("normal")}
            >
              Bình thường
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => applyPreset("fast")}
            >
              Nhanh
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => applyPreset("veryfast")}
            >
              Rất nhanh
            </Button>
          </div>

          <div className="d-flex align-items-center justify-content-between gap-3 mt-3">
            <div>
              <small>
                Tốc độ hiện hiện tại:{" "}
                <b>
                  {scrollSpeed}px / {scrollInterval}ms
                </b>
              </small>
            </div>

            <div className="d-flex gap-2">
              <Button
                variant={autoScroll ? "warning" : "success"}
                onClick={() => {
                  setAutoScroll(!autoScroll);
                  setShowModal(false);
                  toast.info(
                    autoScroll ? "⏹️ Dừng tự cuộn." : "🌀 Bắt đầu tự cuộn..."
                  );
                }}
              >
                {autoScroll ? "⏹️ Dừng" : "▶️ Bắt đầu"}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AutoScrollControl;
