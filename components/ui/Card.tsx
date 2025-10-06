import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, title }) => {
  return (
    <div className={`bg-surface rounded-lg shadow-sm border border-border overflow-hidden ${className}`}>
      {title && (
        <div className="p-4 bg-background border-b border-border">
          <h3 className="text-lg font-bold text-text-dark">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};