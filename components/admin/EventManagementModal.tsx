
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AppData } from '../../data';
import { CoffeeSample, CuppingEvent, Role } from '../../types';
import { EventSamplesUpdateData } from '../../App';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Trash2, AlertTriangle } from 'lucide-react';

interface EventManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CuppingEvent | null;
  appData: AppData;
  onUpdate: (data: EventSamplesUpdateData) => void;
}

const newSampleTemplate: Omit<CoffeeSample, 'id' | 'blindCode'> = {
    farmerId: '',
    farmName: '',
    region: '',
    altitude: 0,
    processingMethod: '',
    variety: '',
    moisture: undefined,
};

const EventManagementModal: React.FC<EventManagementModalProps> = ({ isOpen, onClose, event, appData, onUpdate }) => {
    // We use a temporary ID for new rows to handle keys properly before saving.
    const [samples, setSamples] = useState<Partial<CoffeeSample>[]>([]);
    
    useEffect(() => {
        if (event) {
            const eventSamples = appData.samples.filter(s => event.sampleIds.includes(s.id));
            setSamples(JSON.parse(JSON.stringify(eventSamples))); // Deep copy to prevent direct mutation
        } else {
            setSamples([]);
        }
    }, [event, appData.samples, isOpen]); // Rerun effect when modal opens

    if (!event) return null;

    const farmers = appData.users.filter(u => u.roles.includes(Role.FARMER));
    const processingMethods = event.processingMethods || [];

    const handleAddRow = () => {
        const tempId = `temp-${Date.now()}`;
        setSamples([...samples, { ...newSampleTemplate, id: tempId, processingMethod: processingMethods[0] || '' }]);
    };

    const handleRemoveRow = (id: string) => {
        setSamples(samples.filter(s => s.id !== id));
    };

    const handleUpdateRow = (id: string, field: keyof Omit<CoffeeSample, 'id' | 'blindCode'>, value: string | number) => {
        setSamples(samples.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSaveChanges = () => {
        // Filter out any invalid samples before saving
        const validSamples = samples.filter(s => s.farmerId && s.farmName && s.variety && s.processingMethod) as CoffeeSample[];
        onUpdate({ eventId: event.id, samples: validSamples });
        onClose();
    };
    
    const isSaveDisabled = samples.some(s => !s.farmerId || !s.farmName || !s.variety || !s.processingMethod);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Samples for: ${event.name}`} size="full">
            <div className="h-full flex flex-col">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3 mb-4">
                    <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-bold text-yellow-800">Editing Live Event Data</h4>
                        <p className="text-sm text-yellow-700">Changes made here will directly affect the event. Adding or removing samples cannot be undone once saved.</p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto">
                    <Card>
                        <table className="w-full text-sm text-left table-auto">
                            <thead>
                                <tr className="border-b border-border bg-background">
                                    <th className="p-2 font-semibold">Farmer</th>
                                    <th className="p-2 font-semibold">Farm Name</th>
                                    <th className="p-2 font-semibold">Variety</th>
                                    <th className="p-2 font-semibold">Region</th>
                                    <th className="p-2 font-semibold">Processing</th>
                                    <th className="p-2 font-semibold">Altitude (m)</th>
                                    <th className="p-2 font-semibold">Moisture (%)</th>
                                    <th className="p-2 font-semibold"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {samples.map((sample) => (
                                    <tr key={sample.id} className="border-b border-border">
                                        <td className="p-1 w-48">
                                            <Select value={sample.farmerId} onChange={e => handleUpdateRow(sample.id!, 'farmerId', e.target.value)}>
                                                <option value="" disabled>Select Farmer</option>
                                                {farmers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </Select>
                                        </td>
                                        <td className="p-1"><Input type="text" value={sample.farmName} onChange={e => handleUpdateRow(sample.id!, 'farmName', e.target.value)} placeholder="e.g., Finca El Paraiso" /></td>
                                        <td className="p-1"><Input type="text" value={sample.variety} onChange={e => handleUpdateRow(sample.id!, 'variety', e.target.value)} placeholder="e.g., Pink Bourbon" /></td>
                                        <td className="p-1"><Input type="text" value={sample.region} onChange={e => handleUpdateRow(sample.id!, 'region', e.target.value)} placeholder="e.g., Colombia, Huila" /></td>
                                        <td className="p-1 w-40">
                                            <Select value={sample.processingMethod} onChange={e => handleUpdateRow(sample.id!, 'processingMethod', e.target.value)}>
                                                <option value="" disabled>Select Method</option>
                                                {processingMethods.map(p => <option key={p} value={p}>{p}</option>)}
                                            </Select>
                                        </td>
                                        <td className="p-1 w-24"><Input type="number" value={sample.altitude} onChange={e => handleUpdateRow(sample.id!, 'altitude', Number(e.target.value))} placeholder="e.g., 1750" /></td>
                                        <td className="p-1 w-28"><Input type="number" step="0.1" value={sample.moisture || ''} onChange={e => handleUpdateRow(sample.id!, 'moisture', Number(e.target.value))} placeholder="e.g., 10.8" /></td>
                                        <td className="p-1 text-center w-12">
                                            <button onClick={() => handleRemoveRow(sample.id!)} className="text-text-light hover:text-red-600 p-2">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {samples.length === 0 && <p className="text-center p-8 text-text-light">No samples have been added to this event yet.</p>}
                    </Card>
                </div>

                <div className="p-4 border-t border-border mt-auto flex justify-between items-center bg-background -m-6 px-6 pt-4">
                    <Button onClick={handleAddRow}>+ Add Sample</Button>
                    <div className="flex items-center space-x-2">
                         <Button variant="secondary" onClick={onClose}>Cancel</Button>
                         <Button onClick={handleSaveChanges} disabled={isSaveDisabled} title={isSaveDisabled ? "Please fill all required fields for each sample" : ""}>
                            Save Changes
                         </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default EventManagementModal;
