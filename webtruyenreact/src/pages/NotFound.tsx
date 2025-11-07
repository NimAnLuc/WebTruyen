import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import notFoundAnimation from '../assets/animation/404.json'; 

const NotFound = () => {
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light bg-gradient" style={{ background: 'linear-gradient(to bottom right, #e0c3fc, #8ec5fc)' }}>
      <motion.div
        className="bg-white bg-opacity-75 border rounded-4 shadow-lg p-5 text-center"
        style={{ maxWidth: '450px', width: '100%' }}
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="mx-auto mb-4" style={{ width: '250px' }}>
          <Lottie animationData={notFoundAnimation} loop={true} />
        </div>
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h2 className="h4 fw-semibold text-dark mt-2">Không tìm thấy trang</h2>
        <p className="text-muted mt-3">
          Trang bạn đang tìm không tồn tại hoặc đã bị xóa. Hãy quay về trang chủ nhé.
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 d-inline-block"
        >
          <Link
            to="/"
            className="btn btn-primary btn-lg rounded-pill shadow"
          >
            Quay lại trang chính
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
