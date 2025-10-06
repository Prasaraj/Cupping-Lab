
import React from 'react';
import { User } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Trophy } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onShowLeaderboard: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin, onShowLeaderboard }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-text-dark mb-2">Welcome to The Cupping Hub</h1>
            <p className="text-text-light">Please select your profile to continue or view the final results.</p>
             <Button onClick={onShowLeaderboard} variant="secondary" className="mt-4 inline-flex items-center space-x-2">
                <Trophy size={16} />
                <span>View Results Leaderboard</span>
            </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div
              key={user.id}
              onClick={() => onLogin(user)}
              className="bg-surface rounded-lg p-6 text-text-dark cursor-pointer transform hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg border border-border hover:border-primary"
            >
              <h3 className="text-xl font-bold">{user.name}</h3>
              <p className="text-primary font-medium">{user.roles.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
