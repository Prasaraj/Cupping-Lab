
import React, { useState, useMemo } from 'react';
import { User, Role, CuppingEvent } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { UserPlus, Search, Filter, MoreHorizontal, Calendar, Key, UserX, Send } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  events: CuppingEvent[];
  onViewUser: (userId: string) => void;
  onInviteUser: () => void;
  onUpdateUsersStatus: (userIds: string[], status: User['status']) => void;
  onAssignUsersToEvent: (userIds: string[], eventId: string) => void;
  onUpdateUserRoles: (userIds: string[], roles: Role[]) => void;
}

const RoleTag = ({ role }: { role: Role }) => {
  const colors: Record<Role, string> = {
    [Role.ADMIN]: 'bg-red-100 text-red-800',
    [Role.HEAD_JUDGE]: 'bg-purple-100 text-purple-800',
    [Role.Q_GRADER]: 'bg-blue-100 text-blue-800',
    [Role.FARMER]: 'bg-green-100 text-green-800',
  };
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[role]}`}>{role}</span>;
};

const StatusTag = ({ status }: { status: User['status'] }) => {
  const colors: Record<User['status'], string> = {
    'Active': 'bg-green-100 text-green-800',
    'Pending Invitation': 'bg-yellow-100 text-yellow-800',
    'Deactivated': 'bg-gray-100 text-gray-800',
  };
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[status]}`}>{status}</span>;
};


const UserManagement: React.FC<UserManagementProps> = ({ users, events, onViewUser, onInviteUser, onUpdateUsersStatus, onAssignUsersToEvent }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');
    const [statusFilter, setStatusFilter] = useState<User['status'] | 'All'>('All');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'All' || user.roles.includes(roleFilter);
            const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUserIds(filteredUsers.map(u => u.id));
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleSelectOne = (userId: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedUserIds(prev => [...prev, userId]);
        } else {
            setSelectedUserIds(prev => prev.filter(id => id !== userId));
        }
    };
    
    const handleAssignToEvent = () => {
        const eventId = prompt("Enter the ID of the event to assign users to:", events.length > 0 ? events[0].id : '');
        if (eventId && events.some(e => e.id === eventId)) {
            onAssignUsersToEvent(selectedUserIds, eventId);
            setSelectedUserIds([]);
        } else if (eventId) {
            alert("Invalid Event ID.");
        }
    };

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-bold">User Management</h3>
                <div className="flex items-center gap-2">
                    {selectedUserIds.length > 0 && (
                        <div className="relative">
                            <Button variant="secondary" onClick={() => setIsBulkActionsOpen(prev => !prev)} className="flex items-center gap-2">
                                Bulk Actions ({selectedUserIds.length}) <MoreHorizontal size={16} />
                            </Button>
                            {isBulkActionsOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-surface rounded-md shadow-lg z-10 border border-border">
                                    <button onClick={handleAssignToEvent} className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-background flex items-center gap-2"><Calendar size={14}/>Assign to Event...</button>
                                    <button onClick={() => { onUpdateUsersStatus(selectedUserIds, 'Pending Invitation'); setIsBulkActionsOpen(false); setSelectedUserIds([]); }} className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-background flex items-center gap-2"><Send size={14}/>Resend Invitations</button>
                                    <button onClick={() => { onUpdateUsersStatus(selectedUserIds, 'Deactivated'); setIsBulkActionsOpen(false); setSelectedUserIds([]); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><UserX size={14}/>Deactivate Selected</button>
                                </div>
                            )}
                        </div>
                    )}
                    <Button onClick={onInviteUser} className="flex items-center gap-2">
                        <UserPlus size={16} /> Invite New User
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-background rounded-lg border border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" size={18} />
                    <Input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <div>
                    <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value as Role | 'All')}>
                        <option value="All">Filter by Role: All</option>
                        {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                    </Select>
                </div>
                <div>
                    <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as User['status'] | 'All')}>
                        <option value="All">Filter by Status: All</option>
                        <option value="Active">Active</option>
                        <option value="Pending Invitation">Pending Invitation</option>
                        <option value="Deactivated">Deactivated</option>
                    </Select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="p-2 w-10"><input type="checkbox" onChange={handleSelectAll} checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length} /></th>
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Roles</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Last Login</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="border-b border-border hover:bg-background">
                                <td className="p-2"><input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={(e) => handleSelectOne(user.id, e.target.checked)} /></td>
                                <td className="p-2"><a href="#" onClick={(e) => { e.preventDefault(); onViewUser(user.id); }} className="font-semibold text-primary hover:underline">{user.name}</a></td>
                                <td className="p-2 text-text-light">{user.email}</td>
                                <td className="p-2"><div className="flex flex-wrap gap-1">{user.roles.map(role => <RoleTag key={role} role={role} />)}</div></td>
                                <td className="p-2"><StatusTag status={user.status} /></td>
                                <td className="p-2 text-text-light">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredUsers.length === 0 && <p className="text-center p-8 text-text-light">No users match the current filters.</p>}
            </div>
        </Card>
    );
};

export default UserManagement;
