
import React, { useState } from 'react';
import { CuppingEvent } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

type EventDetailsData = Omit<CuppingEvent, 'id' | 'sampleIds' | 'isResultsRevealed' | 'assignedQGraderIds' | 'assignedHeadJudgeIds'>;

interface Step1DetailsProps {
  data: EventDetailsData;
  onUpdate: (data: EventDetailsData) => void;
}

const processingMethodOptions = ['Washed', 'Natural', 'Honey', 'Anaerobic', 'Other'];
const suggestedTags = ['Regional', 'Championship', 'Experimental', 'Private QC'];

const Step1Details: React.FC<Step1DetailsProps> = ({ data, onUpdate }) => {
    const [tagInput, setTagInput] = useState('');

    const handleProcessingMethodChange = (method: string) => {
        const currentMethods = data.processingMethods || [];
        const newMethods = currentMethods.includes(method)
            ? currentMethods.filter(m => m !== method)
            : [...currentMethods, method];
        onUpdate({ ...data, processingMethods: newMethods });
    };
    
    const handleAddTag = () => {
        const newTag = tagInput.trim();
        if (newTag && !(data.tags || []).includes(newTag)) {
            onUpdate({ ...data, tags: [...(data.tags || []), newTag] });
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onUpdate({ ...data, tags: (data.tags || []).filter(tag => tag !== tagToRemove) });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card title="Event Details">
                <div className="space-y-6">
                    <div>
                        <Label htmlFor="eventName">Event Name (Required)</Label>
                        <Input 
                            id="eventName" 
                            type="text" 
                            placeholder="e.g., Northern Thailand Washed Process Championship 2024"
                            value={data.name} 
                            onChange={(e) => onUpdate({ ...data, name: e.target.value })} 
                        />
                    </div>
                    <div>
                        <Label htmlFor="eventDate">Event Date (Required)</Label>
                        <Input 
                            id="eventDate" 
                            type="date" 
                            value={data.date} 
                            onChange={(e) => onUpdate({ ...data, date: e.target.value })} 
                        />
                    </div>
                    <div>
                        <Label htmlFor="eventDescription">Description (Optional)</Label>
                        <textarea 
                            id="eventDescription"
                            rows={3}
                            className="w-full p-2 border border-border rounded-md focus:ring-1 focus:ring-primary focus:border-primary bg-background"
                            placeholder="A brief summary of the event's goals or focus."
                            value={data.description || ''}
                            onChange={(e) => onUpdate({ ...data, description: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>Processing Method(s) for this Event</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-background border border-border rounded-md">
                            {processingMethodOptions.map(method => (
                                <label key={method} className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={data.processingMethods?.includes(method) || false}
                                        onChange={() => handleProcessingMethodChange(method)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span>{method}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <Label>Event Tags (Optional)</Label>
                        <div className="p-3 bg-background border border-border rounded-md">
                            <div className="flex items-center space-x-2">
                                <Input 
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }}}
                                    placeholder="Type a tag and press Enter"
                                />
                                <Button type="button" variant="secondary" onClick={handleAddTag}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3 min-h-[28px]">
                                {(data.tags || []).map(tag => (
                                    <span key={tag} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                        {tag}
                                        <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-blue-500 hover:text-blue-700 focus:outline-none">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-border">
                                <p className="text-xs text-text-light mb-2">Suggestions:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedTags.map(tag => (
                                        <Button 
                                            key={tag}
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            disabled={(data.tags || []).includes(tag)}
                                            onClick={() => {
                                                if (!(data.tags || []).includes(tag)) {
                                                    onUpdate({ ...data, tags: [...(data.tags || []), tag] });
                                                }
                                            }}
                                            className="disabled:opacity-50"
                                        >
                                            + {tag}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Step1Details;
