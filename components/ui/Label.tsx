
import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({ children, className, ...props }) => {
    return (
        <label className={`block text-sm font-medium text-text-light mb-1 ${className}`} {...props}>
            {children}
        </label>
    );
};
