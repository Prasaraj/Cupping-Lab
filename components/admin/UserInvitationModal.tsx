
import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Role, CuppingEvent } from '../../types';
import { UserInviteData } from '../../App';
import { AlertTriangle } from 'lucide-react';

interface UserInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserInviteData) => void;
  events: CuppingEvent[];
}

type Step = 1 | 2 | 3;

const UserInvitationModal: React.FC<UserInvitationModalProps> = ({ isOpen, onClose, onSubmit, events }) => {
  const [step, setStep] = useState<Step>(1);
  const [emails, setEmails] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [eventId, setEventId] = useState<string>('none');

  const handleClose = () => {
    // Reset state on close
    setStep(1);
    setEmails('');
    setRoles([]);
    setEventId('none');
    onClose();
  };

  const handleRoleChange = (role: Role, isChecked: boolean) => {
    if (isChecked) {
      setRoles(prev => [...prev, role]);
    } else {
      setRoles(prev => prev.filter(r => r !== role));
    }
  };

  const handleSubmit = () => {
    const emailList = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (emailList.length === 0 || roles.length === 0) {
        alert("Please enter at least one email and select at least one role.");
        return;
    }
    onSubmit({ emails: emailList, roles, eventId: eventId !== 'none' ? eventId : undefined });
    handleClose();
  };
  
  const isNextDisabled = () => {
      if (step === 1) return emails.trim() === '';
      if (step === 2) return roles.length === 0;
      return false;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite New User" size="md">
      <div className="space-y-6">
        {step === 1 && (
          <div>
            <h3 className="font-bold text-lg mb-2">Step 1: Enter Emails</h3>
            <Label htmlFor="userEmails">Enter one or more email addresses, separated by commas, spaces, or new lines.</Label>
            <textarea
              id="userEmails"
              rows={5}
              className="w-full p-2 border border-border rounded-md focus:ring-1 focus:ring-primary focus:border-primary bg-background"
              placeholder="user1@example.com, user2@example.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
          </div>
        )}
        
        {step === 2 && (
          <div>
            <h3 className="font-bold text-lg mb-2">Step 2: Assign Roles</h3>
            <p className="text-sm text-text-light mb-3">Select all roles that should be assigned to these users. A user can have multiple roles.</p>
            <div className="grid grid-cols-2 gap-3">
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
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3 text-sm">
                  <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-yellow-800"><span className="font-bold">Warning:</span> Administrator role will grant full control.</p>
                </div>
              )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-bold text-lg mb-2">Step 3: Add to Event (Optional)</h3>
            <Label htmlFor="eventSelect">If you want to add these new users to an event right away, select it here.</Label>
             <select
                id="eventSelect"
                value={eventId}
                onChange={e => setEventId(e.target.value)}
                className="w-full p-2 border border-border rounded-md focus:ring-1 focus:ring-primary focus:border-primary bg-background"
            >
                <option value="none">Don't add to an event</option>
                {events.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}
            </select>
          </div>
        )}

        <div className="pt-4 border-t border-border flex justify-between items-center">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <div className="flex items-center space-x-2">
                {step > 1 && <Button variant="secondary" onClick={() => setStep(prev => prev - 1 as Step)}>Back</Button>}
                {step < 3 ? (
                    <Button onClick={() => setStep(prev => prev + 1 as Step)} disabled={isNextDisabled()}>Next</Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={isNextDisabled()}>Send Invitations</Button>
                )}
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default UserInvitationModal;
