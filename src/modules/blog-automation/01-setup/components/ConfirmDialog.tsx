import React from 'react';
import Button from '@/shared/components/ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-11/12 shadow-2xl transform transition-all duration-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
            ⚠️
          </div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        </div>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
          {message}
        </p>
        
        <div className="flex space-x-3 justify-end">
          <Button
            onClick={onCancel}
            variant="secondary"
            size="sm"
          >
            취소
          </Button>
          <Button
            onClick={onConfirm}
            variant="danger"
            size="sm"
          >
            삭제
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;