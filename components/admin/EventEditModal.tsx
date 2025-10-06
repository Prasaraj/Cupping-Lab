
import React, { useState, useEffect } from 'react';
import { CuppingEvent } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import Step1Details from './Step1Details';
import { EventDetailsUpdateData } from '../../App';

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CuppingEvent | null;
  onUpdate: (eventId: string, data: EventDetailsUpdateData) => void;
}

const EventEditModal: React.FC<EventEditModalProps> = ({ isOpen, onClose, event, onUpdate }) => {
    const [eventDetails, setEventDetails] = useState<EventDetailsUpdateData | null>(null);

    useEffect(() => {
        if (isOpen && event) {
             setEventDetails({
                name: event.name,
                date: event.date,
                description: event.description || '',
                processingMethods: [...(event.processingMethods || [])],
                tags: [...(event.tags || [])],
            });
        } else {
            setEventDetails(null);
        }
    }, [isOpen, event]);

    const handleSaveChanges = () => {
        if (event && eventDetails) {
            if (eventDetails.name && eventDetails.date) {
                onUpdate(event.id, eventDetails);
                onClose();
            } else {
                alert("Event Name and Date are required.");
            }
        }
    };

    const isSaveDisabled = !eventDetails || !eventDetails.name || !eventDetails.date;

    if (!isOpen || !event || !eventDetails) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Event: ${event.name}`} size="xl">
            <Step1Details data={eventDetails} onUpdate={setEventDetails} />
            <div className="flex justify-end space-x-2 pt-6 border-t border-border -mx-6 -mb-6 px-6 pb-4 mt-6">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSaveChanges} disabled={isSaveDisabled}>Save Changes</Button>
            </div>
        </Modal>
    );
};

export default EventEditModal;
