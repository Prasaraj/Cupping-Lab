
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select: React.FC<SelectProps> = ({ className, children, ...props }) => {
  return (
    <select
      className={`w-full p-2 border border-border rounded-md focus:ring-1 focus:ring-primary focus:border-primary bg-background ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};
