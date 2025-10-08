import React from 'react';
import ReactDOM from 'react-dom';
import { TbX } from 'react-icons/tb';
import { motion } from 'framer-motion';

import useDisableScroll from '../../hooks/useDisableScroll';

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ onClose, children, className }) => {
  useDisableScroll();

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 -z-10 size-full bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={handleOverlayClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.5,
        }}
      ></motion.div>
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{
          duration: 0.3,
        }}
        className={`m-2 md:m-0 ${className || ''}`}
      >
        {children}
      </motion.div>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-50 rounded-full border border-teal-500/20 bg-teal-50 p-1.5 text-teal-500 shadow hover:bg-teal-100 dark:bg-teal-300/10 dark:text-teal-500 dark:hover:bg-teal-300/20"
      >
        <TbX className="text-xl" />
      </button>
    </div>,
    document.body,
  );
};

export default Modal;
