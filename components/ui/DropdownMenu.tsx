import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from './Button';

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

const useDropdown = () => {
    const context = useContext(DropdownContext);
    if (!context) {
        throw new Error('useDropdown must be used within a Dropdown provider');
    }
    return context;
};

const DropdownRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
            <div className="relative inline-block text-left" ref={dropdownRef}>
                {children}
            </div>
        </DropdownContext.Provider>
    );
};

const Trigger: React.FC<{ children?: React.ReactNode; disabled?: boolean; title?: string; }> = ({ children, disabled, title }) => {
    const { isOpen, setIsOpen } = useDropdown();
    return (
        <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            aria-haspopup="true"
            aria-expanded={isOpen}
            disabled={disabled}
            title={title}
            className="px-2"
        >
            {children || <MoreHorizontal size={16} />}
        </Button>
    );
};

const Content: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isOpen } = useDropdown();
    if (!isOpen) return null;

    return (
        <div
            className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-surface ring-1 ring-black ring-opacity-5 z-10 border border-border"
            role="menu"
            aria-orientation="vertical"
        >
            <div className="py-1" role="none">
                {children}
            </div>
        </div>
    );
};

const Item: React.FC<{ onClick?: () => void; children: React.ReactNode; className?: string; }> = ({ onClick, children, className }) => {
    const { setIsOpen } = useDropdown();
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
        setIsOpen(false);
    };

    return (
        <button
            onClick={handleClick}
            className={`w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-background flex items-center gap-3 ${className}`}
            role="menuitem"
        >
            {children}
        </button>
    );
};

const Separator: React.FC = () => {
    return <div className="border-t border-border my-1 mx-1" />;
};

// FIX: Refactored Dropdown to use Object.assign to correctly type the compound component. This resolves all related TypeScript errors.
export const Dropdown = Object.assign(DropdownRoot, {
    Trigger,
    Content,
    Item,
    Separator,
});
