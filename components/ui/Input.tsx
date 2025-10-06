
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`w-full p-2 border border-border rounded-md focus:ring-1 focus:ring-primary focus:border-primary bg-background disabled:bg-gray-100 ${className}`}
      {...props}
    />
  );
};
