
import React, { useState, useMemo, useEffect } from 'react';
import { User, CuppingEvent, CoffeeSample, ScoreSheet, Descriptor } from '../../types';
import { AppData } from '../../data';
import { AdjudicationData } from '../../App';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ChevronLeft, Edit, CheckCircle, Award, Flag, TrendingUp, TrendingDown, ClipboardPaste, AlertTriangle } from 'lucide-react';

const HIGH_VARIANCE_THRESHOLD = 0.75; // For overall attribute stdDev (in Variance column)
const MEDIUM_VARIANCE_THRESHOLD = 0.4; // For overall attribute stdDev (in Variance column)
const HIGH_DEVIATION_CELL_THRESHOLD = 0.75; // For high deviation of a single score from attribute average
const MEDIUM_DEVIATION_CELL_THRESHOLD = 0.4; // For medium deviation of a single score from attribute average


const calculateStats = (scores: number[]) => {
    if (!scores || scores.length < 2) return { average: scores[0] || 0, stdDev: 0, range: [scores[0] || 0, scores[0] || 0] };
    const average = scores.reduce((sum, val) => sum + val, 0) / scores.length;
    const variance = scores.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const range = [Math.min(...scores), Math.max(...scores)];
    return { average, stdDev, range };
};

const getGradeFromScore = (score: number) => {
    if (score >= 90) return 'Outstanding';
    if (score >= 85) return 'Excellent';
    if (score >= 80) return 'Specialty';
    return 'Below Specialty';
};

// --- Sub-components for the Cockpit ---

const AtAGlanceMetrics: React.FC<{ sample: CoffeeSample, stats: any, graderCount: number }> = ({ sample, stats, graderCount }) => {
    return (
        <Card title="At-a-Glance Dashboard">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
                <div><p className="text-sm text-text-light">Avg. Total Score</p><p className="text-2xl font-bold">{stats.average.toFixed(2)}</p></div>
                <div><p className="text-sm text-text-light">Std. Deviation</p><p className="text-2xl font-bold">{stats.stdDev.toFixed(2)}</p></div>
                <div><p className="text-sm text-text-light">Score Range</p><p className="text-2xl font-bold">{`${stats.range[0].toFixed(2)} - ${stats.range[1].toFixed(2)}`}</p></div>
                <div><p className="text-sm text-text-light">Graders</p><p className="text-2xl font-bold">{graderCount}</p></div>
                <div><p className="text-sm text-text-light">Initial Grade</p><p className="text-xl font-bold text-primary">{getGradeFromScore(stats.average)}</p></div>
            </div>
        </Card>
    );
};

const ScoreHeatmap: React.FC<{ comparisonData: any[], graders: User[] }> = ({ comparisonData, graders }) => {
    return (
        <Card title="Score Consensus Heatmap">
            <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-background"><tr className="border-b border-border">
                        <th className="p-3 font-semibold">Attribute</th>
                        {graders.map(g => <th key={g.id} className="p-3 font-semibold text-center">{g.name.split(' ')[0]}</th>)}
                        <th className="p-3 font-semibold text-center">Avg</th>
                        <th className="p-3 font-semibold text-center">Variance</th>
                    </tr></thead>
                    <tbody>{comparisonData.map(row => {
                        let varianceIcon;
                        if (row.stdDev > HIGH_VARIANCE_THRESHOLD) varianceIcon = <span className="flex items-center justify-center gap-1 text-red-600"><AlertTriangle size={14} /> High</span>;
                        else if (row.stdDev > MEDIUM_VARIANCE_THRESHOLD) varianceIcon = <span className="flex items-center justify-center gap-1 text-yellow-600">● Med</span>;
                        else varianceIcon = <span className="flex items-center justify-center gap-1 text-green-600">● Low</span>;

                        return (
                            <tr key={row.attribute} className="border-t border-border">
                                <td className="p-3 font-medium">{row.attribute}</td>
                                {graders.map(g => {
                                    const score = row[g.id] ?? 0;
                                    let cellClass = '';
                                    const deviation = score - row.average;

                                    if (deviation > HIGH_DEVIATION_CELL_THRESHOLD) {
                                        cellClass = 'bg-green-200 text-green-900 font-bold'; // High positive deviation
                                    } else if (deviation > MEDIUM_DEVIATION_CELL_THRESHOLD) {
                                        cellClass = 'bg-green-100 text-green-800 font-semibold'; // Medium positive deviation
                                    } else if (deviation < -HIGH_DEVIATION_CELL_THRESHOLD) {
                                        cellClass = 'bg-red-200 text-red-900 font-bold'; // High negative deviation
                                    } else if (deviation < -MEDIUM_DEVIATION_CELL_THRESHOLD) {
                                        cellClass = 'bg-red-100 text-red-800 font-semibold'; // Medium negative deviation
                                    }
                                    
                                    return <td key={g.id} className={`p-3 text-center tabular-nums transition-colors duration-200 ${cellClass}`}>{score.toFixed(2)}</td>;
                                })}
                                <td className="p-3 text-center font-semibold tabular-nums bg-gray-50">{row.average.toFixed(2)}</td>
                                <td className="p-3 text-center tabular-nums font-medium text-xs bg-gray-50">{varianceIcon}</td>
                            </tr>
                        );
                    })}</tbody>
                </table>
            </div>
        </Card>
    );
};

const QualitativeInsights: React.FC<{ scoresForSample: ScoreSheet[], graders: User[] }> = ({ scoresForSample, graders }) => {
    const descriptorFrequency = useMemo(() => {
        const allDescriptors = scoresForSample.flatMap(s => s.descriptors.map(d => d.name));
        const counts = allDescriptors.reduce((acc, desc) => { acc[desc] = (acc[desc] || 0) + 1; return acc; }, {} as Record<string, number>);
        return Object.entries(counts).sort(([, a], [, b]) => b - a);
    }, [scoresForSample]);

    return (
        <Card title="Qualitative Insights Panel">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <h4 className="font-bold mb-2">Descriptor Frequency</h4>
                    <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                        {descriptorFrequency.length > 0 ? descriptorFrequency.map(([name, count]) => (
                            <div key={name} className="flex justify-between items-center text-sm p-1 bg-background rounded">
                                <span>{name}</span><span className="font-bold text-primary">{count}</span>
                            </div>
                        )) : <p className="text-sm text-text-light">No descriptors were used.</p>}
                    </div>
                </div>
                <div className="md:col-span-2">
                    <h4 className="font-bold mb-2">Consolidated Grader Notes</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {scoresForSample.map(score => {
                            const grader = graders.find(g => g.id === score.qGraderId);
                            return (
                                <div key={score.id}><p className="font-semibold text-sm">{grader?.name}:</p><p className="text-sm italic text-text-light pl-2 border-l-2 border-border">"{score.notes || 'No comments.'}"</p></div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const FinalizationPanel: React.FC<{ sample: CoffeeSample, avgScore: number, descriptorProfile: string, onUpdateAdjudication: (data: AdjudicationData) => void, onBack: () => void }> = ({ sample, avgScore, descriptorProfile, onUpdateAdjudication, onBack }) => {
    const [finalScore, setFinalScore] = useState<string>(sample.adjudicatedFinalScore?.toFixed(2) || avgScore.toFixed(2));
    const [justification, setJustification] = useState<string>(sample.adjudicationJustification || '');
    const [gradeLevel, setGradeLevel] = useState<string>(sample.gradeLevel || getGradeFromScore(avgScore));
    const [headJudgeNotes, setHeadJudgeNotes] = useState<string>(sample.headJudgeNotes || '');

    const showJustification = useMemo(() => Math.abs(parseFloat(finalScore) - avgScore) > 0.01, [finalScore, avgScore]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateAdjudication({
            score: parseFloat(finalScore),
            grade: gradeLevel,
            notes: headJudgeNotes,
            justification: showJustification ? justification : '',
            flagged: false,
        });
        onBack();
    };

    const handleFlag = () => {
        onUpdateAdjudication({ flagged: true });
        onBack();
    };
    
    return (
        <Card title="Finalization & Action Panel">
            {sample.adjudicatedFinalScore ? (
                 <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="mx-auto text-green-600 mb-2" size={32}/>
                    <h3 className="font-bold text-green-800">Judgement Locked</h3>
                    <p className="text-sm text-green-700 mt-1">Final Score: {sample.adjudicatedFinalScore.toFixed(2)}</p>
                 </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="finalScore">Final Official Score</Label>
                        <Input id="finalScore" type="number" step="0.25" value={finalScore} onChange={e => setFinalScore(e.target.value)} required />
                    </div>
                    {showJustification && (
                        <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <Label htmlFor="justification" className="mb-0">Justification for change</Label>
                                <span className="text-xs italic text-primary">Why did you adjust the score?</span>
                            </div>
                            <Input id="justification" type="text" value={justification} onChange={e => setJustification(e.target.value)} required placeholder="e.g., Sided with majority on acidity." />
                        </div>
                    )}
                    <div>
                        <Label htmlFor="gradeLevel">Grade Level</Label>
                        <Select id="gradeLevel" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} required>
                            {['Outstanding', 'Excellent', 'Specialty', 'Below Specialty'].map(g => <option key={g} value={g}>{g}</option>)}
                        </Select>
                    </div>
                    <div>
                        <div className="flex justify-between items-center"><Label htmlFor="headJudgeNotes">Final Notes for Farmer (GenNote)</Label><Button type="button" size="sm" variant="secondary" className="flex items-center gap-1" onClick={() => setHeadJudgeNotes(p => `${p} ${descriptorProfile}`.trim())}><ClipboardPaste size={14} /> Insert Profile</Button></div>
                        <textarea id="headJudgeNotes" value={headJudgeNotes} onChange={e => setHeadJudgeNotes(e.target.value)} placeholder="Enter the final, holistic thoughts..." rows={4} className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary text-sm"></textarea>
                    </div>
                    <div className="flex flex-col space-y-2 pt-2">
                        <Button type="submit" className="w-full flex items-center justify-center gap-2"><Award size={16}/> Save & Lock Judgement</Button>
                        <Button type="button" variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={handleFlag}><Flag size={16}/> Flag for Discussion</Button>
                    </div>
                </form>
            )}
        </Card>
    );
};


// --- The Main Cockpit View ---
interface AdjudicationCockpitProps { sample: CoffeeSample; appData: AppData; event: CuppingEvent; onBack: () => void; onUpdateAdjudication: (sampleId: string, finalData: AdjudicationData) => void; }

const AdjudicationCockpit: React.FC<AdjudicationCockpitProps> = ({ sample, appData, event, onBack, onUpdateAdjudication }) => {
    const scoresForSample = useMemo(() => appData.scores.filter(s => s.sampleId === sample.id && s.eventId === event.id && s.isSubmitted), [appData.scores, sample.id, event.id]);
    const graders = useMemo(() => appData.users.filter(u => scoresForSample.some(s => s.qGraderId === u.id)), [appData.users, scoresForSample]);
    const scoreAttributes: (keyof Omit<ScoreSheet['scores'], 'finalScore' | 'taints' | 'faults'>)[] = ['fragrance', 'flavor', 'aftertaste', 'acidity', 'body', 'balance', 'uniformity', 'cleanCup', 'sweetness', 'overall'];

    const overallStats = useMemo(() => calculateStats(scoresForSample.map(s => s.scores.finalScore)), [scoresForSample]);

    const comparisonData = useMemo(() => scoreAttributes.map(attr => {
        const scores = scoresForSample.map(s => s.scores[attr]);
        const stats = calculateStats(scores);
        return { attribute: attr.charAt(0).toUpperCase() + attr.slice(1), average: stats.average, stdDev: stats.stdDev, ...scoresForSample.reduce((acc, s) => ({ ...acc, [s.qGraderId]: s.scores[attr] }), {}) };
    }), [scoresForSample, scoreAttributes]);

    const descriptorProfile = useMemo(() => {
        const topDescriptors = scoresForSample.flatMap(s => s.descriptors.map(d => d.name)).reduce((acc, desc) => { acc[desc] = (acc[desc] || 0) + 1; return acc; }, {} as Record<string, number>);
        return Object.entries(topDescriptors).sort(([,a],[,b]) => b-a).slice(0, 5).map(([name]) => name).join(', ');
    }, [scoresForSample]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Adjudication Cockpit: <span className="text-primary font-mono">{sample.blindCode}</span></h2>
                <Button onClick={onBack} variant="secondary" className="flex items-center space-x-1"><ChevronLeft size={16}/><span>Back to Samples</span></Button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <AtAGlanceMetrics sample={sample} stats={overallStats} graderCount={graders.length} />
                    <ScoreHeatmap comparisonData={comparisonData} graders={graders} />
                    <QualitativeInsights scoresForSample={scoresForSample} graders={graders} />
                </div>
                <div className="xl:col-span-1">
                    <div className="sticky top-24">
                        <FinalizationPanel sample={sample} avgScore={overallStats.average} descriptorProfile={descriptorProfile} onUpdateAdjudication={(data) => onUpdateAdjudication(sample.id, data)} onBack={onBack}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---

interface HeadJudgeDashboardProps { currentUser: User; appData: AppData; onUpdateAdjudication: (sampleId: string, finalData: AdjudicationData) => void; }

const HeadJudgeDashboard: React.FC<HeadJudgeDashboardProps> = ({ currentUser, appData, onUpdateAdjudication }) => {
    const [selectedEvent, setSelectedEvent] = useState<CuppingEvent | null>(null);
    const [selectedSample, setSelectedSample] = useState<CoffeeSample | null>(null);

    const samplesForEvent = useMemo(() => selectedEvent ? appData.samples.filter(s => selectedEvent.sampleIds.includes(s.id)) : [], [selectedEvent, appData.samples]);

    if (selectedSample && selectedEvent) {
        return <AdjudicationCockpit sample={selectedSample} appData={appData} event={selectedEvent} onBack={() => setSelectedSample(null)} onUpdateAdjudication={onUpdateAdjudication} />
    }

    if (selectedEvent) {
        return (
             <div>
                 <Button onClick={() => setSelectedEvent(null)} className="mb-4 flex items-center space-x-1" variant="secondary"> <ChevronLeft size={16}/> <span>Back to Events</span></Button>
                <Card title={`Adjudicate Samples for ${selectedEvent.name}`}>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {samplesForEvent.map(sample => {
                             const relevantScores = appData.scores.filter(s => s.sampleId === sample.id && s.eventId === selectedEvent.id && s.isSubmitted);
                             const { average } = calculateStats(relevantScores.map(s => s.scores.finalScore));

                             return (
                                <div key={sample.id} onClick={() => setSelectedSample(sample)} className="relative p-4 border border-border rounded-lg cursor-pointer hover:bg-background hover:border-primary transition-colors duration-200 text-center space-y-1">
                                    {sample.adjudicatedFinalScore && <span className="absolute top-2 right-2 text-green-600" title="Finalized"><CheckCircle size={18}/></span>}
                                    {sample.flaggedForDiscussion && <span className="absolute top-2 left-2 text-yellow-600" title="Flagged for Discussion"><Flag size={18}/></span>}
                                    <p className="font-mono text-xl font-bold">{sample.blindCode}</p>
                                    <p className="text-sm font-semibold">{relevantScores.length > 0 ? `${average.toFixed(2)} avg` : 'No Scores'}</p>
                                    <p className="text-xs text-text-light">{relevantScores.length} / {selectedEvent.assignedQGraderIds.length} scores in</p>
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
            <h2 className="text-3xl font-bold mb-6">Adjudication Dashboard</h2>
             {appData.events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {appData.events.map(event => (
                        <Card key={event.id} title={event.name}>
                            <p className="text-text-light mb-1">Date: {event.date}</p>
                             <p className="text-text-light">Total Samples: {event.sampleIds.length}</p>
                            <Button onClick={() => setSelectedEvent(event)} className="mt-4 flex items-center space-x-2"><Edit size={16} /><span>Adjudicate Event</span></Button>
                        </Card>
                    ))}
                </div>
             ) : ( <Card><p className="text-center text-text-light">There are no cupping events to adjudicate at this time.</p></Card> )}
        </div>
    );
};

export default HeadJudgeDashboard;
