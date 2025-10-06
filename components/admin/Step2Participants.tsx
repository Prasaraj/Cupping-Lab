
import React from 'react';
import { User, Role } from '../../types';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { Card } from '../ui/Card';
import { X } from 'lucide-react';

interface Step2ParticipantsProps {
  data: { assignedQGraderIds: string[], assignedHeadJudgeIds: string[] };
  onUpdate: (data: { assignedQGraderIds: string[], assignedHeadJudgeIds: string[] }) => void;
  allUsers: User[];
}

const Step2Participants: React.FC<Step2ParticipantsProps> = ({ data, onUpdate, allUsers }) => {
    
    // FIX: Property 'role' does not exist on type 'User'. Did you mean 'roles'? The User type defines roles as an array. Use `u.roles.includes(...)` to check for a role.
    const headJudges = allUsers.filter(u => u.roles.includes(Role.HEAD_JUDGE));
    // FIX: Property 'role' does not exist on type 'User'. Did you mean 'roles'? The User type defines roles as an array. Use `u.roles.includes(...)` to check for a role.
    const qGraders = allUsers.filter(u => u.roles.includes(Role.Q_GRADER));

    const handleAddParticipant = (role: 'qGrader' | 'headJudge', userId: string) => {
        if (!userId) return;
        if (role === 'headJudge') {
            if (!data.assignedHeadJudgeIds.includes(userId)) {
                onUpdate({ ...data, assignedHeadJudgeIds: [...data.assignedHeadJudgeIds, userId] });
            }
        } else {
            if (!data.assignedQGraderIds.includes(userId)) {
                onUpdate({ ...data, assignedQGraderIds: [...data.assignedQGraderIds, userId] });
            }
        }
    };

    const handleRemoveParticipant = (role: 'qGrader' | 'headJudge', userId: string) => {
        if (role === 'headJudge') {
            onUpdate({ ...data, assignedHeadJudgeIds: data.assignedHeadJudgeIds.filter(id => id !== userId) });
        } else {
            onUpdate({ ...data, assignedQGraderIds: data.assignedQGraderIds.filter(id => id !== userId) });
        }
    };

    const renderParticipantList = (ids: string[], role: 'qGrader' | 'headJudge') => (
        <div className="space-y-2 mt-2 p-2 border border-border rounded-md bg-background min-h-[50px]">
            {ids.map(id => {
                const user = allUsers.find(u => u.id === id);
                if (!user) return null;
                return (
                    <div key={id} className="flex justify-between items-center p-2 bg-surface rounded-md text-sm">
                        <span>{user.name}</span>
                        <button onClick={() => handleRemoveParticipant(role, id)} className="text-text-light hover:text-red-600">
                            <X size={16} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
    
    return (
        <div className="max-w-4xl mx-auto">
            <Card title="Assign Judging Team">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Head Judges Section */}
                    <div>
                        <h3 className="text-lg font-bold mb-2">Assign Head Judge(s)</h3>
                        <div>
                            <Label htmlFor="headJudgeSelect">Add by name</Label>
                            <Select 
                                id="headJudgeSelect"
                                onChange={e => handleAddParticipant('headJudge', e.target.value)}
                                value=""
                            >
                                <option value="" disabled>Select a Head Judge...</option>
                                {headJudges.map(judge => (
                                    <option key={judge.id} value={judge.id} disabled={data.assignedHeadJudgeIds.includes(judge.id)}>
                                        {judge.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        {renderParticipantList(data.assignedHeadJudgeIds, 'headJudge')}
                    </div>

                    {/* Q Graders Section */}
                    <div>
                        <h3 className="text-lg font-bold mb-2">Assign Q Graders</h3>
                         <div>
                            <Label htmlFor="qGraderSelect">Add by name</Label>
                            <Select 
                                id="qGraderSelect"
                                onChange={e => handleAddParticipant('qGrader', e.target.value)}
                                value=""
                            >
                                <option value="" disabled>Select a Q Grader...</option>
                                {qGraders.map(grader => (
                                    <option key={grader.id} value={grader.id} disabled={data.assignedQGraderIds.includes(grader.id)}>
                                        {grader.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        {renderParticipantList(data.assignedQGraderIds, 'qGrader')}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Step2Participants;
