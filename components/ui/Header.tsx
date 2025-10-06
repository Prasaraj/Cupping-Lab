
import React from 'react';
import { User } from '../../types';
import { Button } from './Button';
import { Coffee } from 'lucide-react';

const CoffeeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v2" /><path d="M14 2v2" /><path d="M16 8a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2" /><path d="M18 7h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2" /><path d="M4 19h16" />
    </svg>
);

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-surface text-text-dark shadow-sm p-4 flex justify-between items-center border-b border-border">
      <div className="flex items-center space-x-3">
        <CoffeeIcon />
        <h1 className="text-xl md:text-2xl font-bold">The Cupping Hub</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right hidden sm:block">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-text-light">{user.roles.join(', ')}</p>
        </div>
        <Button onClick={onLogout} variant="secondary">Logout</Button>
      </div>
    </header>
  );
};

export default Header;
