import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <div className="flex flex-col items-center text-center">
        {/* Warning Icon */}
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Message */}
        <p className="text-slate-600 dark:text-slate-350 text-sm mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center space-x-3 w-full">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
