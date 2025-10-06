
import React, { useState, useMemo } from 'react';
import { User, CoffeeSample, CuppingEvent } from '../../types';
import { AppData } from '../../data';
import { NewSampleRegistrationData } from '../../App';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import SampleReport from '../reporting/SampleReport';
import Certificate from '../reporting/Certificate';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Download, Award, TrendingUp, Star, ShieldCheck, DownloadCloud, Calendar, PlusCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FarmerDashboardProps {
  currentUser: User;
  appData: AppData;
  onRegisterForEvent: (eventId: string, sampleData: NewSampleRegistrationData) => void;
}

const getRankSuffix = (rank: number) => {
    if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
    switch (rank % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};

const getGradeFromScore = (score: number) => {
    if (score >= 90) return 'Outstanding';
    if (score >= 85) return 'Excellent';
    if (score >= 80) return 'Specialty';
    return 'Below Specialty';
};

const RegistrationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (sampleData: NewSampleRegistrationData) => void;
    event: CuppingEvent;
    lastSample?: CoffeeSample;
}> = ({ isOpen, onClose, onSubmit, event, lastSample }) => {
    const [sampleData, setSampleData] = useState<NewSampleRegistrationData>({
        farmName: lastSample?.farmName || '',
        region: lastSample?.region || '',
        altitude: lastSample?.altitude || 0,
        processingMethod: event.processingMethods?.[0] || '',
        variety: lastSample?.variety || '',
        moisture: lastSample?.moisture || undefined,
    });

    const handleChange = (field: keyof NewSampleRegistrationData, value: string | number) => {
        setSampleData(prev => ({...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sampleData.farmName || !sampleData.region || !sampleData.variety || !sampleData.processingMethod) {
            alert("Please fill out all required fields.");
            return;
        }
        onSubmit(sampleData);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Register for: ${event.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <p className="text-sm text-text-light">Enter the details for the coffee sample you wish to submit. Some fields have been pre-filled from your last submission.</p>
                 <div>
                    <Label htmlFor="farmName">Farm Name</Label>
                    <Input id="farmName" value={sampleData.farmName} onChange={e => handleChange('farmName', e.target.value)} required />
                 </div>
                 <div>
                    <Label htmlFor="variety">Variety</Label>
                    <Input id="variety" value={sampleData.variety} onChange={e => handleChange('variety', e.target.value)} required />
                 </div>
                 <div>
                    <Label htmlFor="region">Region</Label>
                    <Input id="region" value={sampleData.region} onChange={e => handleChange('region', e.target.value)} required />
                 </div>
                 <div>
                    <Label htmlFor="processingMethod">Processing Method</Label>
                    <Select id="processingMethod" value={sampleData.processingMethod} onChange={e => handleChange('processingMethod', e.target.value)} required>
                        <option value="" disabled>Select a method...</option>
                        {event.processingMethods?.map(p => <option key={p} value={p}>{p}</option>)}
                    </Select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="altitude">Altitude (m)</Label>
                        <Input id="altitude" type="number" value={sampleData.altitude} onChange={e => handleChange('altitude', Number(e.target.value))} />
                    </div>
                    <div>
                        <Label htmlFor="moisture">Moisture (%)</Label>
                        <Input id="moisture" type="number" step="0.1" value={sampleData.moisture || ''} onChange={e => handleChange('moisture', Number(e.target.value))} />
                    </div>
                 </div>
                 <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Submit Registration</Button>
                </div>
            </form>
        </Modal>
    );
};


const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ currentUser, appData, onRegisterForEvent }) => {
  const [viewingReportForSample, setViewingReportForSample] = useState<CoffeeSample | null>(null);
  const [viewingCertificateFor, setViewingCertificateFor] = useState<{ sample: CoffeeSample, event: CuppingEvent, rank: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events'>('dashboard');

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<CuppingEvent | null>(null);

  const farmerSamples = useMemo(() => appData.samples.filter(s => s.farmerId === currentUser.id).sort((a,b) => b.id.localeCompare(a.id)), [appData.samples, currentUser.id]);

  const allEventsWithFarmerSamples = useMemo(() => appData.events
    .map(event => {
      const samplesInEvent = farmerSamples.filter(s => event.sampleIds.includes(s.id));
      if (samplesInEvent.length === 0) return null;
      
      const rankedEventSamples = event.isResultsRevealed
        ? appData.samples
            .filter(s => event.sampleIds.includes(s.id) && s.adjudicatedFinalScore)
            .sort((a, b) => (b.adjudicatedFinalScore ?? 0) - (a.adjudicatedFinalScore ?? 0))
        : [];
      
      return {
        ...event,
        samples: samplesInEvent,
        rankedEventSamples,
      };
    })
    .filter((event): event is CuppingEvent & { samples: CoffeeSample[], rankedEventSamples: CoffeeSample[] } => event !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [appData.events, appData.samples, farmerSamples]);

  const upcomingEvents = useMemo(() => 
    appData.events.filter(e => e.registrationOpen).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), 
    [appData.events]
  );
  
  const handleOpenRegisterModal = (event: CuppingEvent) => {
    setSelectedEventForRegistration(event);
    setIsRegisterModalOpen(true);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
    setSelectedEventForRegistration(null);
  };

  const handleRegisterSubmit = (sampleData: NewSampleRegistrationData) => {
      if(selectedEventForRegistration) {
          onRegisterForEvent(selectedEventForRegistration.id, sampleData);
      }
      handleCloseRegisterModal();
  };


  const latestRevealedEvent = useMemo(() => allEventsWithFarmerSamples.find(e => e.isResultsRevealed), [allEventsWithFarmerSamples]);

  const topSampleInLatestEvent = useMemo(() => {
    if (!latestRevealedEvent) return null;
    return [...latestRevealedEvent.samples].sort((a, b) => (b.adjudicatedFinalScore ?? 0) - (a.adjudicatedFinalScore ?? 0))[0];
  }, [latestRevealedEvent]);

  const performanceData = useMemo(() => {
    return farmerSamples
      .filter(s => s.adjudicatedFinalScore)
      .map(s => {
        const event = appData.events.find(e => e.sampleIds.includes(s.id));
        return {
          name: event ? new Date(event.date).getFullYear().toString() : 'Unknown',
          date: event ? event.date : '1970-01-01',
          score: s.adjudicatedFinalScore,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [farmerSamples, appData.events]);
  
  const earnedBadges = useMemo(() => {
    const badges: Record<string, { name: string; icon: React.ElementType; color: string; count: number; description: string }> = {};

    const defineBadge = (key: string, name: string, icon: React.ElementType, color: string, description: string) => {
        if (!badges[key]) {
            badges[key] = { name, icon, color, count: 0, description };
        }
        badges[key].count += 1;
    };

    allEventsWithFarmerSamples.forEach(event => {
        if (!event.isResultsRevealed) return;

        event.samples.forEach(sample => {
            if (!sample.adjudicatedFinalScore) return;

            if (sample.adjudicatedFinalScore >= 90) defineBadge('outstanding', 'Outstanding Cup', Star, 'text-blue-500', 'Achieved a score of 90+');
            if (sample.adjudicatedFinalScore >= 85) defineBadge('excellent', '85+ Club', Star, 'text-green-500', 'Achieved a score of 85+');

            const rank = event.rankedEventSamples.findIndex(s => s.id === sample.id) + 1;
            if (rank > 0) {
                if (rank === 1) defineBadge('first_place', '1st Place Winner', Award, 'text-yellow-500', 'Finished first in an event');
                if (rank <= 3) defineBadge('top_3', 'Top 3 Finisher', Award, 'text-gray-500', 'Finished in the top 3');
                if (rank <= 10) defineBadge('top_10', 'Top 10 Finisher', Award, 'text-orange-700', 'Finished in the top 10');
            }
        });
    });
    
    if (performanceData.length >= 2) {
        let maxImprovement = 0;
        for (let i = 1; i < performanceData.length; i++) {
            const improvement = (performanceData[i].score ?? 0) - (performanceData[i-1].score ?? 0);
            if (improvement > maxImprovement) maxImprovement = improvement;
        }
        if (maxImprovement >= 2.0) defineBadge('most_improved', 'Most Improved', TrendingUp, 'text-teal-500', 'Score improved by 2+ points');
    }

    return Object.values(badges).sort((a,b) => b.count - a.count);
  }, [allEventsWithFarmerSamples, performanceData]);

  const TabButton = ({ tab, label }: { tab: 'dashboard' | 'events', label: string }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors duration-200 ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-text-light hover:text-text-dark border-b-2 border-transparent'}`}
    >
        {label}
    </button>
  );

  const DashboardView = () => (
    <div className="space-y-8">
        {allEventsWithFarmerSamples.length === 0 ? (
            <Card>
                <p className="text-center text-text-light">You have not submitted any coffee samples yet. Check the "Upcoming Events" tab to register for a competition.</p>
            </Card>
        ) : (
            <>
            {latestRevealedEvent && topSampleInLatestEvent && (
                <Card className="bg-primary/5 border-primary/50">
                <p className="font-semibold text-primary">Results are in for {latestRevealedEvent.name}!</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-4">
                    <div className="md:col-span-2">
                        <p className="text-sm text-text-light">Highlight from your latest submission:</p>
                        <h3 className="text-2xl font-bold mt-1">{topSampleInLatestEvent.farmName} - {topSampleInLatestEvent.variety}</h3>
                        <div className="flex items-center space-x-4 mt-2">
                        {(() => {
                            const rankInfo = { rank: latestRevealedEvent.rankedEventSamples.findIndex(s => s.id === topSampleInLatestEvent.id) + 1, total: latestRevealedEvent.rankedEventSamples.length };
                            return rankInfo && rankInfo.rank > 0 && rankInfo.rank <= 3 && (
                            <div className="flex items-center space-x-2 text-yellow-600"><Award size={20} /><span className="font-semibold">Top Result!</span></div>
                            );
                        })()}
                        <span className="text-sm font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{topSampleInLatestEvent.processingMethod}</span>
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        {(() => {
                            const rankInfo = { rank: latestRevealedEvent.rankedEventSamples.findIndex(s => s.id === topSampleInLatestEvent.id) + 1, total: latestRevealedEvent.rankedEventSamples.length };
                            return rankInfo && rankInfo.rank > 0 && <p className="text-lg font-bold">{rankInfo.rank}{getRankSuffix(rankInfo.rank)} <span className="font-normal text-text-light">of {rankInfo.total}</span></p>;
                        })()}
                        <p className="text-5xl font-bold text-primary">{topSampleInLatestEvent.adjudicatedFinalScore?.toFixed(2)}</p>
                        <p className="font-semibold">{getGradeFromScore(topSampleInLatestEvent.adjudicatedFinalScore ?? 0)}</p>
                        <Button onClick={() => setViewingReportForSample(topSampleInLatestEvent)} size="sm" className="mt-2">View Detailed Report</Button>
                    </div>
                </div>
                </Card>
            )}

            {earnedBadges.length > 0 && (
                <Card>
                    <div className="flex items-center space-x-2 mb-4"><ShieldCheck className="text-primary" /><h3 className="text-xl font-bold">My Achievements</h3></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {earnedBadges.map(badge => (
                            <div key={badge.name} className="flex flex-col items-center text-center p-4 bg-background rounded-lg border border-border" title={badge.description}>
                                <div className={`relative ${badge.color}`}><badge.icon size={40} />{badge.count > 1 && <span className="absolute -top-1 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{badge.count}</span>}</div>
                                <p className="font-bold mt-2 text-sm">{badge.name}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {performanceData.length > 1 && (
                <Card>
                    <div className="flex items-center space-x-2 mb-4"><TrendingUp className="text-primary" /><h3 className="text-xl font-bold">Your Performance Over Time</h3></div>
                    <div className="w-full h-64">
                        <ResponsiveContainer><LineChart data={performanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={['dataMin - 1', 'dataMax + 1']} /><Tooltip /><Legend /><Line type="monotone" dataKey="score" stroke="#FF7600" strokeWidth={2} activeDot={{ r: 8 }} /></LineChart></ResponsiveContainer>
                    </div>
                </Card>
            )}

            <div>
                <h3 className="text-2xl font-bold mb-4">All Coffee Submissions</h3>
                <div className="space-y-6">
                {allEventsWithFarmerSamples.map(event => (
                    <Card key={event.id} title={event.name}>
                    <div className="space-y-4 divide-y divide-border">
                        {event.samples.map(sample => {
                        const isFinalizedAndRevealed = event.isResultsRevealed && sample.adjudicatedFinalScore !== undefined;
                        let rank: number | null = null;
                        if (isFinalizedAndRevealed) {
                            const sampleIndex = event.rankedEventSamples.findIndex(s => s.id === sample.id);
                            if (sampleIndex !== -1) rank = sampleIndex + 1;
                        }

                        return (
                            <div key={sample.id} className="pt-4 first:pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                    <div className="md:col-span-3">
                                        <h4 className="font-bold text-lg">{sample.farmName} - {sample.variety}</h4>
                                        <p className="text-sm text-text-light">{sample.region} - {sample.processingMethod} Process</p>
                                        <div className="mt-2">
                                        {sample.blindCode === 'PENDING' ? (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Registered</span>
                                        ) : !isFinalizedAndRevealed ? (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Cupping in Progress</span>
                                        ) : null}
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right">
                                    {isFinalizedAndRevealed ? (
                                        <>
                                        <div className="flex items-baseline justify-start md:justify-end space-x-2">
                                            {rank && <p className="text-xl font-bold text-primary">{rank}<span className="text-base font-semibold">{getRankSuffix(rank)}</span></p>}
                                            <p className="text-3xl font-bold text-text-dark">{sample.adjudicatedFinalScore?.toFixed(2)}</p>
                                        </div>
                                        <p className="text-sm text-text-light mb-2">{rank ? 'Rank | Final Score' : 'Final Score'}</p>
                                        <div className="flex flex-col md:flex-row gap-2 mt-2">
                                            <Button onClick={() => setViewingReportForSample(sample)} size="sm" className="flex items-center space-x-1 w-full md:w-auto justify-center"><Download size={14} /><span>View Report</span></Button>
                                            {rank && rank <= 3 && (<Button variant="secondary" size="sm" className="flex items-center space-x-1 w-full md:w-auto justify-center" onClick={() => setViewingCertificateFor({ sample, event, rank })}><DownloadCloud size={14} /><span>Certificate</span></Button>)}
                                        </div>
                                        </>
                                    ) : (<><p className="text-2xl font-bold text-gray-400">--</p><p className="text-sm text-text-light mb-2">Awaiting Results</p></>)}
                                    </div>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                    </Card>
                ))}
                </div>
            </div>
        </>)}
    </div>
  );

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Farmer Dashboard</h2>
       <div className="border-b border-border">
            <nav className="-mb-px flex space-x-6">
                 <TabButton tab="dashboard" label="My Dashboard" />
                 <TabButton tab="events" label="Upcoming Events" />
            </nav>
        </div>

        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'events' && (
            <div className="space-y-6">
                <h3 className="text-2xl font-bold">Register for an Event</h3>
                {upcomingEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {upcomingEvents.map(event => {
                            const farmerSamplesInEvent = farmerSamples.filter(s => event.sampleIds.includes(s.id));
                            return (
                                <Card key={event.id} title={event.name}>
                                    <div className="space-y-3">
                                        <p className="text-sm text-text-light">{event.description}</p>
                                        <p className="text-sm font-medium"><strong className="text-text-dark">Date:</strong> {new Date(event.date + 'T00:00:00').toLocaleDateString()}</p>
                                        {farmerSamplesInEvent.length > 0 && (
                                            <div className="pt-3 mt-3 border-t border-border">
                                                <h4 className="font-semibold text-sm">Your Submissions:</h4>
                                                <ul className="list-disc pl-5 text-sm text-text-light">
                                                    {farmerSamplesInEvent.map(s => <li key={s.id}>{s.variety} ({s.processingMethod})</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="pt-3">
                                            <Button onClick={() => handleOpenRegisterModal(event)} className="w-full flex justify-center items-center space-x-2">
                                                <PlusCircle size={16} />
                                                <span>Register New Sample</span>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <div className="text-center p-8">
                            <Calendar size={40} className="mx-auto text-text-light mb-4"/>
                            <p className="text-text-light">There are no events open for registration at this time. Please check back later!</p>
                        </div>
                    </Card>
                )}
            </div>
        )}

      <Modal isOpen={!!viewingReportForSample} onClose={() => setViewingReportForSample(null)} title="Official Cupping Report" size="xl">
        {viewingReportForSample && <SampleReport sample={viewingReportForSample} appData={appData} />}
      </Modal>

      <Modal isOpen={!!viewingCertificateFor} onClose={() => setViewingCertificateFor(null)} title="Official Certificate" size="xl">
        {viewingCertificateFor && (
            <div className="certificate-print-area -m-6">
                <Certificate
                    sample={viewingCertificateFor.sample}
                    event={viewingCertificateFor.event}
                    farmer={currentUser}
                    rank={viewingCertificateFor.rank}
                />
            </div>
        )}
      </Modal>

      {selectedEventForRegistration && (
            <RegistrationModal 
                isOpen={isRegisterModalOpen}
                onClose={handleCloseRegisterModal}
                onSubmit={handleRegisterSubmit}
                event={selectedEventForRegistration}
                lastSample={farmerSamples[0]}
            />
        )}
    </div>
  );
};

export default FarmerDashboard;