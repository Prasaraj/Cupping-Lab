import React, { useState, useEffect } from 'react';
import { User, ActivityLog, Role } from '../../types';
import { UserUpdateData } from '../../App';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { ChevronLeft, User as UserIcon, Lock, Trash2, Send, AlertTriangle } from 'lucide-react';

interface UserProfileProps {
  user: User;
  activityLog: ActivityLog[];
  onBack: () => void;
  onUpdateUser: (data: UserUpdateData) => void;
  onUpdateStatus: (status: User['status']) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, activityLog, onBack, onUpdateUser, onUpdateStatus }) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [roles, setRoles] = useState<Role[]>(user.roles);

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone || '');
    setRoles(user.roles);
  }, [user]);

  const handleRoleChange = (role: Role, isChecked: boolean) => {
    if (isChecked) {
      setRoles(prev => [...prev, role]);
    } else {
      setRoles(prev => prev.filter(r => r !== role));
    }
  };

  const handleSaveChanges = () => {
    onUpdateUser({ name, phone, roles });
  };

  const isChanged = name !== user.name || phone !== (user.phone || '') || JSON.stringify(roles.sort()) !== JSON.stringify(user.roles.sort());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Profile: {user.name}</h2>
        <Button onClick={onBack} variant="secondary" className="flex items-center space-x-1">
          <ChevronLeft size={16} /> <span>Back to All Users</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="User Information">
            <div className="space-y-4">
              <div>
                <Label htmlFor="userName">Name</Label>
                <Input id="userName" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="userEmail">Email</Label>
                <Input id="userEmail" value={user.email} disabled className="bg-gray-100 cursor-not-allowed" />
              </div>
              <div>
                <Label htmlFor="userPhone">Phone</Label>
                <Input id="userPhone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="No phone number provided" />
              </div>
            </div>
          </Card>
          <Card title="Role Management">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.values(Role).map(role => (
                  <label key={role} className="flex items-center space-x-3 p-3 bg-background rounded-md border border-border">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={roles.includes(role)}
                      onChange={e => handleRoleChange(role, e.target.checked)}
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
              {roles.includes(Role.ADMIN) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3 text-sm">
                  <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-yellow-800">
                    <span className="font-bold">Administrator Role:</span> This will grant the user full control over all events and settings. Please be certain.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {isChanged && (
             <div className="flex justify-end">
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <div className="p-6 space-y-3">
              <h3 className="text-lg font-bold">Account Actions</h3>
              <Button variant="secondary" className="w-full flex items-center justify-center gap-2"><Lock size={14}/>Send Password Reset Link</Button>
              {user.status === 'Pending Invitation' && (
                <Button variant="secondary" onClick={() => onUpdateStatus('Pending Invitation')} className="w-full flex items-center justify-center gap-2"><Send size={14}/>Resend Invitation</Button>
              )}
              {user.status === 'Deactivated' ? (
                 <Button onClick={() => onUpdateStatus('Active')} className="w-full flex items-center justify-center gap-2"><UserIcon size={14}/>Re-activate User</Button>
              ) : (
                <Button variant="danger" onClick={() => onUpdateStatus('Deactivated')} className="w-full flex items-center justify-center gap-2"><Trash2 size={14}/>Deactivate User</Button>
              )}
            </div>
          </Card>
          <Card title="Activity History">
             <div>
              <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {activityLog.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => (
                    <li key={log.id} className="text-sm">
                        <p className="font-semibold text-text-dark">{log.action}</p>
                        <p className="text-text-light text-xs">{new Date(log.timestamp).toLocaleString()}</p>
                    </li>
                ))}
                {activityLog.length === 0 && <p className="text-sm text-text-light">No activity recorded for this user.</p>}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
