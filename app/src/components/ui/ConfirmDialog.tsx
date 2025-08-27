import React from 'react';
import Modal from './Modal';
import { AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <Modal onClose={onCancel}>
          <div className="mx-auto w-full max-w-lg border border-dark/20 bg-white p-10 shadow dark:border-light/20 dark:bg-dark">
            {title && <h2 className="mb-4 text-xl font-semibold">{title}</h2>}
            {description && <p className="text-sm opacity-80">{description}</p>}

            <hr className="my-10 dark:border-light/20" />

            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="transition-150 rounded-full bg-gray-200 px-6 py-2.5 text-gray-800 transition hover:bg-gray-300"
                disabled={loading}
                type="button"
                aria-label={cancelText}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                type="button"
                aria-label={confirmText}
                className="transition-150 rounded-full bg-teal-300 px-6 py-2.5 text-dark transition"
                disabled={loading}
              >
                {loading ? 'Processing...' : confirmText}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
