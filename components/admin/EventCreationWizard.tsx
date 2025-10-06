
import React, { useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AppData } from '../../data';
import { NewFullEventData } from '../../App';
import Step1Details from './Step1Details';
import Step2Participants from './Step2Participants';
import Step3Samples from './Step3Samples';
import { CoffeeSample, CuppingEvent, Role } from '../../types';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface EventCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fullEventData: NewFullEventData) => void;
  appData: AppData;
}

type WizardStep = 'details' | 'participants' | 'samples' | 'confirm';

const initialEventState = {
    details: { name: '', date: '', description: '', processingMethods: [], tags: [] },
    participants: { assignedQGraderIds: [], assignedHeadJudgeIds: [] },
    samples: []
};

const EventCreationWizard: React.FC<EventCreationWizardProps> = ({ isOpen, onClose, onSubmit, appData }) => {
    const [step, setStep] = useState<WizardStep>('details');
    
    // State for each step's data
    const [eventDetails, setEventDetails] = useState<Omit<CuppingEvent, 'id' | 'sampleIds' | 'isResultsRevealed' | 'assignedQGraderIds' | 'assignedHeadJudgeIds'>>(initialEventState.details);
    const [participants, setParticipants] = useState<{ assignedQGraderIds: string[], assignedHeadJudgeIds: string[] }>(initialEventState.participants);
    const [samples, setSamples] = useState<Omit<CoffeeSample, 'id' | 'blindCode'>[]>(initialEventState.samples);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const resetWizard = useCallback(() => {
        setStep('details');
        setEventDetails(initialEventState.details);
        setParticipants(initialEventState.participants);
        setSamples(initialEventState.samples);
    }, []);

    const handleClose = () => {
        resetWizard();
        onClose();
    };

    const handleFinalSubmit = () => {
        const fullEventData: NewFullEventData = {
            eventDetails: eventDetails,
            assignedQGraderIds: participants.assignedQGraderIds,
            assignedHeadJudgeIds: participants.assignedHeadJudgeIds,
            samples: samples,
        };
        onSubmit(fullEventData);
        setIsConfirmModalOpen(false);
        resetWizard();
    };

    const renderStep = () => {
        switch (step) {
            case 'details':
                return <Step1Details data={eventDetails} onUpdate={setEventDetails} />;
            case 'participants':
                return <Step2Participants data={participants} onUpdate={setParticipants} allUsers={appData.users} />;
            case 'samples':
                // FIX: Property 'role' does not exist on type 'User'. Did you mean 'roles'? The User type defines roles as an array. Use `u.roles.includes(...)` to check for a role.
                return <Step3Samples data={samples} onUpdate={setSamples} farmers={appData.users.filter(u => u.roles.includes(Role.FARMER))} processingMethods={eventDetails.processingMethods || []} />;
            default:
                return null;
        }
    };

    const isNextDisabled = () => {
        switch (step) {
            case 'details':
                return !eventDetails.name || !eventDetails.date;
            case 'participants':
                return participants.assignedHeadJudgeIds.length === 0 || participants.assignedQGraderIds.length === 0;
            case 'samples':
                return samples.length === 0 || samples.some(s => !s.farmerId || !s.farmName || !s.processingMethod);
            default:
                return false;
        }
    };

    const stepTitles: Record<WizardStep, string> = {
        details: 'Step 1 of 3: Event Details',
        participants: 'Step 2 of 3: Manage Participants',
        samples: 'Step 3 of 3: Register Coffee Samples',
        confirm: 'Confirmation'
    };

    const stepIndicator = (
        <div className="flex justify-center items-center space-x-4 mb-4">
            {Object.keys(stepTitles).slice(0, 3).map((s, index) => {
                const stepNumber = index + 1;
                const currentStepNumber = ['details', 'participants', 'samples'].indexOf(step) + 1;
                const isCompleted = stepNumber < currentStepNumber;
                const isActive = stepNumber === currentStepNumber;

                return (
                    <React.Fragment key={s}>
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-border text-text-light'}`}>
                                {isCompleted ? <CheckCircle size={18} /> : stepNumber}
                            </div>
                            <span className={`ml-2 text-sm font-semibold ${isActive ? 'text-primary' : 'text-text-light'}`}>{stepTitles[s as WizardStep].split(': ')[1]}</span>
                        </div>
                        {index < 2 && <div className="h-0.5 w-16 bg-border"></div>}
                    </React.Fragment>
                );
            })}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Cupping Event" size="full">
            <div className="h-full flex flex-col">
                {stepIndicator}
                <div className="flex-grow overflow-y-auto p-2">
                    {renderStep()}
                </div>
                <div className="p-4 border-t border-border mt-auto flex justify-between items-center bg-background -m-6 px-6 pt-4">
                    <Button variant="secondary" onClick={handleClose}>Save as Draft & Close</Button>
                    <div className="flex items-center space-x-2">
                        {step !== 'details' && <Button variant="secondary" onClick={() => setStep(step === 'participants' ? 'details' : 'participants')}>Back</Button>}
                        {step !== 'samples' ? (
                            <Button onClick={() => setStep(step === 'details' ? 'participants' : 'samples')} disabled={isNextDisabled()}>Next</Button>
                        ) : (
                            <Button onClick={() => setIsConfirmModalOpen(true)} disabled={isNextDisabled()}>Finish & Activate Event</Button>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm & Activate Event">
                <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
                        <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold text-yellow-800">This action cannot be undone.</h4>
                            <p className="text-sm text-yellow-700">Activating the event will generate blind codes, lock the sample list, and prepare the event for cupping.</p>
                        </div>
                    </div>
                     <div>
                        <h3 className="font-bold text-lg">Event Summary</h3>
                        <p><strong>Name:</strong> {eventDetails.name}</p>
                        <p><strong>Total Samples:</strong> {samples.length}</p>
                        <p><strong>Head Judges:</strong> {participants.assignedHeadJudgeIds.length}</p>
                        <p><strong>Q Graders:</strong> {participants.assignedQGraderIds.length}</p>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleFinalSubmit}>Confirm & Activate</Button>
                    </div>
                </div>
            </Modal>
        </Modal>
    );
};

export default EventCreationWizard;
