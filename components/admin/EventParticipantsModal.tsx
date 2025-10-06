import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AppData } from '../../data';
import { CuppingEvent, Role, User } from '../../types';
import { EventParticipantsUpdateData } from '../../App';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { X } from 'lucide-react';

interface EventParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CuppingEvent | null;
  appData: AppData;
  onUpdate: (data: EventParticipantsUpdateData) => void;
}

const ParticipantList: React.FC<{
    users: User[];
    onRemove: (userId: string) => void;
}> = ({ users, onRemove }) => (
    <div className="space-y-2 mt-2 p-2 border border-border rounded-md bg-background min-h-[100px] max-h-60 overflow-y-auto">
        {users.map(user => (
            <div key={user.id} className="flex justify-between items-center p-2 bg-surface rounded-md text-sm">
                <span>{user.name}</span>
                <button onClick={() => onRemove(user.id)} className="text-text-light hover:text-red-600">
                    <X size={16} />
                </button>
            </div>
        ))}
         {users.length === 0 && <p className="text-center text-text-light p-4">No one assigned.</p>}
    </div>
);

const EventParticipantsModal: React.FC<EventParticipantsModalProps> = ({ isOpen, onClose, event, appData, onUpdate }) => {
    const [assignedQGraderIds, setAssignedQGraderIds] = useState<string[]>([]);
    const [assignedHeadJudgeIds, setAssignedHeadJudgeIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && event) {
            setAssignedQGraderIds(event.assignedQGraderIds);
            setAssignedHeadJudgeIds(event.assignedHeadJudgeIds);
        }
    }, [isOpen, event]);

    if (!event) return null;

    const allHeadJudges = appData.users.filter(u => u.roles.includes(Role.HEAD_JUDGE));
    const allQGraders = appData.users.filter(u => u.roles.includes(Role.Q_GRADER));
    
    const assignedHeadJudges = appData.users.filter(u => assignedHeadJudgeIds.includes(u.id));
    const assignedQGraders = appData.users.filter(u => assignedQGraderIds.includes(u.id));

    const handleAddParticipant = (role: 'qGrader' | 'headJudge', userId: string) => {
        if (!userId) return;
        if (role === 'headJudge') {
            if (!assignedHeadJudgeIds.includes(userId)) {
                setAssignedHeadJudgeIds(prev => [...prev, userId]);
            }
        } else {
            if (!assignedQGraderIds.includes(userId)) {
                setAssignedQGraderIds(prev => [...prev, userId]);
            }
        }
    };
    
    const handleRemoveParticipant = (role: 'qGrader' | 'headJudge', userId: string) => {
        if (role === 'headJudge') {
            setAssignedHeadJudgeIds(prev => prev.filter(id => id !== userId));
        } else {
            setAssignedQGraderIds(prev => prev.filter(id => id !== userId));
        }
    };
    
    const handleSaveChanges = () => {
        onUpdate({
            eventId: event.id,
            assignedQGraderIds,
            assignedHeadJudgeIds,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Participants for: ${event.name}`} size="xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Head Judges */}
                <div>
                    <h3 className="text-lg font-bold mb-2">Head Judges</h3>
                    <div>
                        <Label htmlFor="headJudgeSelect">Add Head Judge</Label>
                        <Select 
                            id="headJudgeSelect"
                            onChange={e => { handleAddParticipant('headJudge', e.target.value); e.target.value = ''; }}
                            value=""
                        >
                            <option value="" disabled>Select a Head Judge...</option>
                            {allHeadJudges.map(judge => (
                                <option key={judge.id} value={judge.id} disabled={assignedHeadJudgeIds.includes(judge.id)}>
                                    {judge.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <ParticipantList users={assignedHeadJudges} onRemove={(id) => handleRemoveParticipant('headJudge', id)} />
                </div>
                
                {/* Q Graders */}
                <div>
                    <h3 className="text-lg font-bold mb-2">Q Graders</h3>
                    <div>
                        <Label htmlFor="qGraderSelect">Add Q Grader</Label>
                        <Select 
                            id="qGraderSelect"
                            onChange={e => { handleAddParticipant('qGrader', e.target.value); e.target.value = ''; }}
                            value=""
                        >
                            <option value="" disabled>Select a Q Grader...</option>
                            {allQGraders.map(grader => (
                                <option key={grader.id} value={grader.id} disabled={assignedQGraderIds.includes(grader.id)}>
                                    {grader.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <ParticipantList users={assignedQGraders} onRemove={(id) => handleRemoveParticipant('qGrader', id)} />
                </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-6 mt-6 border-t border-border">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
        </Modal>
    );
};

export default EventParticipantsModal;