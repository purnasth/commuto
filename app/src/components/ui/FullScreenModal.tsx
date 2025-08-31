import React from 'react';
import ReactDOM from 'react-dom';
import { TbX } from 'react-icons/tb';
import useDisableScroll from '../../hooks/useDisableScroll';
import { motion } from 'framer-motion';

interface FullScreenModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const FullScreenModal: React.FC<FullScreenModalProps> = ({
  onClose,
  children,
}) => {
  useDisableScroll();

  return ReactDOM.createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
      }}
    >
      {children}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-50 rounded-full border border-teal-500/20 bg-teal-50 p-1.5 text-teal-500 shadow hover:bg-teal-100 dark:bg-teal-300/10 dark:text-teal-500 dark:hover:bg-teal-300/20"
      >
        <TbX className="text-xl" />
      </button>
    </motion.div>,
    document.body,
  );
};

export default FullScreenModal;
