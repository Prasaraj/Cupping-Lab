
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { User, CuppingEvent, CoffeeSample, ScoreSheet, CuppingScore, Descriptor } from '../../types';
import { AppData } from '../../data';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Modal } from '../ui/Modal';
import { CheckCircle, FileClock, Minus, Plus, Save, Coffee, ChevronLeft, Mic, X, Lock } from 'lucide-react';

// FIX: Add type definitions for SpeechRecognition API to the global window object to resolve TypeScript errors.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// --- Helper Functions & Data ---
function debounce<F extends (...args: any[]) => any>(fn: F, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function(this: any, ...args: Parameters<F>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => { fn.apply(this, args); }, delay);
  };
}

const FLAVOR_CATEGORIES: Record<string, string[]> = {
    'Fruity': ['Berry', 'Citrus Fruit', 'Dried Fruit', 'Stone Fruit', 'Tropical Fruit'],
    'Floral': ['Jasmine', 'Rose', 'Chamomile', 'Honeysuckle'],
    'Sweet': ['Brown Sugar', 'Caramel', 'Honey', 'Maple Syrup', 'Molasses', 'Vanilla'],
    'Nutty/Cocoa': ['Almond', 'Hazelnut', 'Peanut', 'Chocolate', 'Dark Chocolate'],
    'Spices': ['Cinnamon', 'Clove', 'Nutmeg', 'Anise', 'Pepper'],
    'Green/Veg': ['Grassy', 'Herbal', 'Pea', 'Hay-like'],
};

type SampleStatus = 'Not Started' | 'Draft' | 'Submitted' | 'Finalized';

// --- Child Components ---
const DefectCounter: React.FC<{ label: string; count: number; onCountChange: (newCount: number) => void; pointValue: number; }> = ({ label, count, onCountChange, pointValue }) => (
    <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
        <div><p className="font-semibold text-red-800">{label}</p><p className="text-xs text-red-600">{-pointValue} points per cup</p></div>
        <div className="flex items-center space-x-2 sm:space-x-3"><Button size="sm" variant="secondary" onClick={() => onCountChange(Math.max(0, count - 1))} className="w-8 h-8 p-0 flex items-center justify-center rounded-full"><Minus size={16} /></Button><span className="font-bold text-lg text-red-800 w-8 text-center tabular-nums">{count}</span><Button size="sm" variant="secondary" onClick={() => onCountChange(count + 1)} className="w-8 h-8 p-0 flex items-center justify-center rounded-full"><Plus size={16} /></Button></div>
    </div>
);

const DescriptorItem: React.FC<{ descriptor: Descriptor; onIntensityChange: (name: string, intensity: number) => void; onRemove: (name: string) => void; }> = ({ descriptor, onIntensityChange, onRemove }) => (
    <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-md">
        <button onClick={() => onRemove(descriptor.name)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
        <span className="font-medium text-sm w-28 truncate">{descriptor.name}</span>
        <input type="range" min="1" max="5" step="1" value={descriptor.intensity} onChange={(e) => onIntensityChange(descriptor.name, parseInt(e.target.value, 10))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
    </div>
);

// --- Voice Recognition Hook ---
const useVoiceRecognition = (onResult: (transcript: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
            setIsListening(false);
        };
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
        recognition.onend = () => {
             setIsListening(false);
        }
        recognitionRef.current = recognition;
    }, [onResult]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    return { isListening, toggleListening, isSupported: !!recognitionRef.current };
};

// --- Cupping Form Component ---
interface CuppingFormProps { scoreSheet: ScoreSheet; sample: CoffeeSample; onSave: (updatedSheet: ScoreSheet) => void; onBack: () => void; }

const CuppingForm: React.FC<CuppingFormProps> = ({ scoreSheet, sample, onSave, onBack }) => {
    const [scores, setScores] = useState<CuppingScore>(scoreSheet.scores);
    const [notes, setNotes] = useState(scoreSheet.notes);
    const [descriptors, setDescriptors] = useState<Descriptor[]>(scoreSheet.descriptors);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
    const [isFlavorModalOpen, setIsFlavorModalOpen] = useState(false);
    const isInitialMount = useRef(true);

    const { isListening, toggleListening, isSupported } = useVoiceRecognition((transcript) => {
        setNotes(prev => prev ? `${prev} ${transcript}` : transcript);
        setSaveStatus('unsaved');
    });

    const calculateFinalScore = useCallback(() => {
        const { taints, faults, finalScore, ...rest } = scores;
        const attributeTotal = Object.values(rest).reduce((sum, val) => sum + val, 0);
        const defectTotal = (taints * 2) + (faults * 4);
        return attributeTotal - defectTotal;
    }, [scores]);

    const debouncedSave = useCallback(debounce((sheetToSave: ScoreSheet) => { onSave(sheetToSave); setSaveStatus('saved'); }, 1500), [onSave]);

    useEffect(() => {
        if (isInitialMount.current) { isInitialMount.current = false; return; }
        if (saveStatus !== 'unsaved') return;
        setSaveStatus('saving');
        const finalScore = calculateFinalScore();
        const sheetToSave: ScoreSheet = { ...scoreSheet, scores: { ...scores, finalScore }, notes, descriptors, isSubmitted: false };
        debouncedSave(sheetToSave);
    }, [scores, notes, descriptors, saveStatus, scoreSheet, calculateFinalScore, debouncedSave]);

    const handleDataChange = () => setSaveStatus('unsaved');
    const handleScoreChange = (field: keyof CuppingScore, value: number) => { setScores(prev => ({ ...prev, [field]: value })); handleDataChange(); };
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setNotes(e.target.value); handleDataChange(); };
    const handleDescriptorIntensityChange = (name: string, intensity: number) => { setDescriptors(prev => prev.map(d => d.name === name ? { ...d, intensity } : d)); handleDataChange(); };
    const handleRemoveDescriptor = (name: string) => { setDescriptors(prev => prev.filter(d => d.name !== name)); handleDataChange(); };
    const toggleDescriptor = (name: string) => { setDescriptors(prev => prev.some(d => d.name === name) ? prev.filter(d => d.name !== name) : [...prev, { name, intensity: 3 }]); handleDataChange(); };

    const handleSubmit = (isFinal: boolean) => {
        const finalScore = calculateFinalScore();
        const updatedSheet: ScoreSheet = { ...scoreSheet, scores: { ...scores, finalScore }, notes, descriptors, isSubmitted: isFinal };
        onSave(updatedSheet);
        onBack();
    };
    
    const scoreFields: { key: keyof CuppingScore; label: string }[] = [
        { key: 'fragrance', label: 'Fragrance/Aroma' }, { key: 'flavor', label: 'Flavor' }, { key: 'aftertaste', label: 'Aftertaste' },
        { key: 'acidity', label: 'Acidity' }, { key: 'body', label: 'Body' }, { key: 'balance', label: 'Balance' }, { key: 'uniformity', label: 'Uniformity' },
        { key: 'cleanCup', label: 'Clean Cup' }, { key: 'sweetness', label: 'Sweetness' }, { key: 'overall', label: 'Overall' },
    ];
    const quickNotes = ["Re-cup", "Favorite", "Check Consistency"];

    return (
        <div className="pb-24">
            <Card>
                <div className="p-4 bg-background border-b border-border -m-6 mb-6">
                    <h3 className="text-lg font-bold text-text-dark">Scoring Sample: <span className="font-mono text-primary">{sample.blindCode}</span></h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Scores Column */}
                    <div className="space-y-4">
                        {scoreFields.map(({ key, label }) => (
                            <div key={key}>
                                <div className="flex justify-between items-center mb-1"><label className="text-sm font-medium text-gray-700">{label}</label><span className="font-semibold text-primary tabular-nums">{scores[key].toFixed(2)}</span></div>
                                <input type="range" min="0" max="10" step="0.25" value={scores[key]} onChange={(e) => handleScoreChange(key, parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                            </div>
                        ))}
                    </div>

                    {/* Notes and Defects Column */}
                    <div className="space-y-6">
                        <div>
                            <Label>Smart Notes</Label>
                            <div className="space-y-3 p-3 border border-border rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <Button size="sm" onClick={() => setIsFlavorModalOpen(true)}>+ Add Descriptors</Button>
                                    {isSupported && <Button size="sm" variant="secondary" onClick={toggleListening} className={`flex items-center space-x-1 ${isListening ? 'bg-red-100 text-red-700' : ''}`}><Mic size={16} /><span>{isListening ? 'Listening...' : 'Dictate'}</span></Button>}
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {descriptors.length > 0 ? descriptors.map(d => <DescriptorItem key={d.name} descriptor={d} onIntensityChange={handleDescriptorIntensityChange} onRemove={handleRemoveDescriptor} />) : <p className="text-sm text-center text-gray-400 py-4">No descriptors added.</p>}
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="final-comments">Final Comments</Label>
                            <textarea id="final-comments" value={notes} onChange={handleNotesChange} rows={3} className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary text-sm" placeholder="e.g., vibrant, floral, tea-like body..."></textarea>
                            <div className="flex items-center space-x-2 mt-2">
                                {quickNotes.map(qn => <Button key={qn} size="sm" variant="secondary" onClick={() => { setNotes(p => `${p} ${qn}.`.trim()); handleDataChange(); }}>{qn}</Button>)}
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-border">
                            <h4 className="text-base font-medium text-gray-800">Defects</h4>
                            <DefectCounter label="Taints" count={scores.taints} onCountChange={(c) => handleScoreChange('taints', c)} pointValue={2} />
                            <DefectCounter label="Faults" count={scores.faults} onCountChange={(c) => handleScoreChange('faults', c)} pointValue={4} />
                        </div>
                    </div>
                </div>
            </Card>

            <Modal isOpen={isFlavorModalOpen} onClose={() => setIsFlavorModalOpen(false)} title="Add Flavor Descriptors">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {Object.entries(FLAVOR_CATEGORIES).map(([category, flavors]) => (
                        <div key={category}>
                            <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-2">{category}</h4>
                            <div className="flex flex-wrap gap-2">
                                {flavors.map(flavor => <Button key={flavor} size="sm" variant={descriptors.some(d => d.name === flavor) ? 'primary' : 'secondary'} onClick={() => toggleDescriptor(flavor)}>{flavor}</Button>)}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-4 mt-4 border-t border-border flex justify-end">
                    <Button onClick={() => setIsFlavorModalOpen(false)}>Done</Button>
                </div>
            </Modal>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface p-3 border-t border-border shadow-md z-10">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Button onClick={onBack} variant="secondary" className="flex items-center space-x-1"><ChevronLeft size={16} /> <span>Back</span></Button>
                    <div className="text-center"><p className="text-sm text-text-light">Final Score</p><p className="text-2xl font-bold text-text-dark tabular-nums">{calculateFinalScore().toFixed(2)}</p></div>
                    <div className="flex items-center space-x-2 w-40 justify-end">
                        <div className="flex items-center space-x-2 text-sm text-text-light">{saveStatus === 'saving' && <><Save size={16} className="animate-spin" /><span>Saving...</span></>}{saveStatus === 'saved' && <><CheckCircle size={16} className="text-green-600"/><span>Saved</span></>}</div>
                        <Button onClick={() => handleSubmit(true)} className={saveStatus === 'saving' ? 'opacity-50 cursor-not-allowed' : ''} disabled={saveStatus === 'saving'}>Submit Final</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---
interface QGraderDashboardProps { currentUser: User; appData: AppData; onUpdateScoreSheet: (sheet: ScoreSheet) => void; }

const QGraderDashboard: React.FC<QGraderDashboardProps> = ({ currentUser, appData, onUpdateScoreSheet }) => {
    const [selectedEvent, setSelectedEvent] = useState<CuppingEvent | null>(null);
    const [selectedSample, setSelectedSample] = useState<CoffeeSample | null>(null);

    const assignedEvents = useMemo(() => appData.events.filter(e => e.assignedQGraderIds.includes(currentUser.id)), [appData.events, currentUser.id]);
    const samplesForEvent = useMemo(() => selectedEvent ? appData.samples.filter(s => selectedEvent.sampleIds.includes(s.id)) : [], [selectedEvent, appData.samples]);

    const getOrCreateScoreSheet = useCallback((sampleId: string): ScoreSheet => {
        const existing = appData.scores.find(s => s.sampleId === sampleId && s.qGraderId === currentUser.id && s.eventId === selectedEvent!.id);
        if (existing) return existing;
        return {
            id: `new-${sampleId}-${currentUser.id}-${selectedEvent!.id}`, eventId: selectedEvent!.id, qGraderId: currentUser.id, sampleId, isSubmitted: false, notes: '', descriptors: [],
            scores: { fragrance: 6, flavor: 6, aftertaste: 6, acidity: 6, body: 6, balance: 6, uniformity: 10, cleanCup: 10, sweetness: 10, overall: 6, taints: 0, faults: 0, finalScore: 76 },
        };
    }, [appData.scores, currentUser.id, selectedEvent]);

    const getSampleStatus = useCallback((scoreSheet: ScoreSheet, event: CuppingEvent): SampleStatus => {
        if (event.isResultsRevealed) {
            return 'Finalized';
        }
        if (scoreSheet.isSubmitted) {
            return 'Submitted';
        }
        // A score sheet exists in the data but is not submitted, so it's a draft.
        // A temporary one created for a "Not Started" sample has an ID starting with "new-".
        if (!scoreSheet.id.startsWith('new-')) { 
            return 'Draft';
        }
        return 'Not Started';
    }, []);

    const statusConfig: Record<SampleStatus, { icon: React.ReactNode; text: string; className: string; borderColor: string; }> = {
        'Not Started': { icon: <Coffee className="text-gray-400" />, text: 'Not Started', className: 'text-text-light', borderColor: 'border-border' },
        'Draft': { icon: <FileClock className="text-yellow-600" />, text: 'Draft', className: 'text-yellow-700', borderColor: 'border-yellow-500' },
        'Submitted': { icon: <CheckCircle className="text-green-600" />, text: 'Submitted', className: 'text-green-700', borderColor: 'border-green-500' },
        'Finalized': { icon: <Lock className="text-blue-600" />, text: 'Finalized', className: 'text-blue-700', borderColor: 'border-blue-500' }
    };

    if (selectedSample && selectedEvent) {
        return <CuppingForm scoreSheet={getOrCreateScoreSheet(selectedSample.id)} sample={selectedSample} onSave={onUpdateScoreSheet} onBack={() => setSelectedSample(null)} />
    }

    if (selectedEvent) {
        return (
            <div>
                <Button onClick={() => setSelectedEvent(null)} className="mb-4 flex items-center space-x-1" variant="secondary"> <ChevronLeft size={16}/> <span>Back to Events</span></Button>
                <Card title={`Sample Tray: ${selectedEvent.name}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {samplesForEvent.map(sample => {
                             const scoreSheet = getOrCreateScoreSheet(sample.id);
                             const status = getSampleStatus(scoreSheet, selectedEvent);
                             const config = statusConfig[status];
                             const isInteractive = status !== 'Finalized';

                             return (
                                <div 
                                    key={sample.id} 
                                    onClick={() => isInteractive && setSelectedSample(sample)} 
                                    className={`relative p-4 border-2 ${config.borderColor} rounded-lg ${isInteractive ? 'cursor-pointer hover:bg-background' : 'cursor-not-allowed opacity-75 bg-gray-50'} transition-colors duration-200 aspect-square flex flex-col justify-center items-center text-center`}
                                >
                                    <div className="absolute top-2 right-2">{config.icon}</div>
                                    <p className="font-mono text-2xl md:text-3xl font-bold">{sample.blindCode}</p>
                                    <p className={`text-sm font-semibold ${config.className}`}>
                                        {(status === 'Submitted' || status === 'Finalized') ? `Score: ${scoreSheet.scores.finalScore.toFixed(2)}` : config.text}
                                    </p>
                                </div>
                             )
                        })}
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Your Cupping Assignments</h2>
            {assignedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {assignedEvents.map(event => (
                        <Card key={event.id} title={event.name}>
                            <p className="text-text-light">Date: {event.date}</p>
                            <p className="text-text-light">Samples to cup: {event.sampleIds.length}</p>
                            <Button onClick={() => setSelectedEvent(event)} className="mt-4">Start Cupping</Button>
                        </Card>
                    ))}
                </div>
            ) : <Card><p className="text-center text-text-light">You have no cupping events assigned to you at the moment.</p></Card>}
        </div>
    );
};

export default QGraderDashboard;
