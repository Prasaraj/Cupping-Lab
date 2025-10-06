
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start p-4 overflow-y-auto" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
    >
      <div 
        className={`bg-surface rounded-lg shadow-xl w-full ${sizeClasses[size]} flex flex-col max-h-[95vh] my-auto`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 flex justify-between items-center border-b border-border flex-shrink-0">
          <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-text-light hover:text-text-dark" aria-label="Close modal">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
            {children}
        </div>
      </div>
    </div>
  );
};
