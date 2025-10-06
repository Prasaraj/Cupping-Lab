import React, { useState, useMemo } from 'react';
import { User, Role, CoffeeSample, CuppingEvent } from '../../types';
import { AppData } from '../../data';
import { NewFullEventData, UserInviteData, UserUpdateData, EventSamplesUpdateData, EventDetailsUpdateData, EventParticipantsUpdateData } from '../../App';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Filter, FileText, UserPlus, Users, Coffee, BarChart2, Calendar, Download, Trophy, Edit, MoreHorizontal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SampleReport from '../reporting/SampleReport';
import EventCreationWizard from '../admin/EventCreationWizard';
import UserManagement from '../admin/UserManagement';
import UserProfile from '../admin/UserProfile';
import UserInvitationModal from '../admin/UserInvitationModal';
import EventManagementModal from '../admin/EventManagementModal';
import EventEditModal from '../admin/EventEditModal';
import EventParticipantsModal from '../admin/EventParticipantsModal';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Dropdown } from '../ui/DropdownMenu';


interface AdminDashboardProps {
  currentUser: User;
  appData: AppData;
  onRevealResults: (eventId: string) => void;
  onCreateFullEvent: (fullEventData: NewFullEventData) => void;
  onInviteUsers: (data: UserInviteData) => void;
  onUpdateUser: (userId: string, data: UserUpdateData) => void;
  onUpdateUsersStatus: (userIds: string[], status: User['status']) => void;
  onAssignUsersToEvent: (userIds: string[], eventId: string) => void;
  onUpdateEventSamples: (data: EventSamplesUpdateData) => void;
  onUpdateEventDetails: (eventId: string, data: EventDetailsUpdateData) => void;
  onUpdateEventParticipants: (data: EventParticipantsUpdateData) => void;
}

type Tab = 'events' | 'users' | 'samples' | 'results';
type SortableSampleKeys = keyof CoffeeSample | 'farmerName';

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const { currentUser, appData, onRevealResults, onCreateFullEvent, onInviteUsers, onUpdateUser, onUpdateUsersStatus, onAssignUsersToEvent, onUpdateEventSamples, onUpdateEventDetails, onUpdateEventParticipants } = props;
    const [activeTab, setActiveTab] = useState<Tab>('events');
    
    // Modal states
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isSampleDetailModalOpen, setIsSampleDetailModalOpen] = useState(false);
    const [selectedSample, setSelectedSample] = useState<CoffeeSample | null>(null);
    const [viewingReportForSample, setViewingReportForSample] = useState<CoffeeSample | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isManageEventModalOpen, setIsManageEventModalOpen] = useState(false);
    const [eventToManage, setEventToManage] = useState<CuppingEvent | null>(null);
    const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CuppingEvent | null>(null);
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
    const [eventToManageParticipants, setEventToManageParticipants] = useState<CuppingEvent | null>(null);


    // User Management State
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);


    // Sorting & Filtering State
    const [sortConfig, setSortConfig] = useState<{ key: SortableSampleKeys; direction: 'ascending' | 'descending' } | null>({ key: 'blindCode', direction: 'ascending' });
    const [processFilter, setProcessFilter] = useState('All');
    const [tagFilter, setTagFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('All');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const revealedEvents = useMemo(() => appData.events
        .filter(e => e.isResultsRevealed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [appData.events]);

    const [eventFilter, setEventFilter] = useState<string>(revealedEvents.length > 0 ? revealedEvents[0].id : 'all');


    const reportData = useMemo(() => {
        let samplesToConsider: CoffeeSample[] = [];
        if (eventFilter === 'all') {
            samplesToConsider = appData.samples.filter(s => s.adjudicatedFinalScore !== undefined && s.adjudicatedFinalScore > 0);
        } else {
            const selectedEvent = appData.events.find(e => e.id === eventFilter);
            if (selectedEvent) {
                samplesToConsider = appData.samples.filter(s => 
                    selectedEvent.sampleIds.includes(s.id) && s.adjudicatedFinalScore !== undefined && s.adjudicatedFinalScore > 0
                );
            }
        }
        const filteredByProcess = samplesToConsider.filter(s => processFilter === 'All' || s.processingMethod === processFilter);
        const ranked = filteredByProcess.sort((a, b) => (b.adjudicatedFinalScore ?? 0) - (a.adjudicatedFinalScore ?? 0));
        return ranked;
    }, [appData.samples, appData.events, eventFilter, processFilter]);

    const scoreDistributionData = useMemo(() => {
        const bins = [
            { name: '< 82', count: 0 }, { name: '82-84', count: 0 }, { name: '84-86', count: 0 },
            { name: '86-88', count: 0 }, { name: '88-90', count: 0 }, { name: '90+', count: 0 },
        ];
        reportData.forEach(sample => {
            const score = sample.adjudicatedFinalScore ?? 0;
            if (score >= 90) bins[5].count++;
            else if (score >= 88) bins[4].count++;
            else if (score >= 86) bins[3].count++;
            else if (score >= 84) bins[2].count++;
            else if (score >= 82) bins[1].count++;
            else if (score > 0) bins[0].count++;
        });
        return bins;
    }, [reportData]);

    const keyMetrics = useMemo(() => {
        if (reportData.length === 0) return { avg: 0, high: 0, low: 0, count: 0 };
        const scores = reportData.map(s => s.adjudicatedFinalScore ?? 0);
        return {
            avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
            high: Math.max(...scores).toFixed(2),
            low: Math.min(...scores).toFixed(2),
            count: scores.length
        }
    }, [reportData]);
    
    const processingMethods = useMemo(() => ['All', ...new Set(appData.samples.map(s => s.processingMethod))], [appData.samples]);
    
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        appData.events.forEach(event => {
            event.tags?.forEach(tag => tags.add(tag));
        });
        return ['All', ...Array.from(tags).sort()];
    }, [appData.events]);

    const filteredEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const applyDateFilter = (event: CuppingEvent): boolean => {
            const [year, month, day] = event.date.split('-').map(Number);
            const eventDate = new Date(year, month - 1, day);

            switch (dateFilter) {
                case 'This Week': {
                    const firstDayOfWeek = new Date(today);
                    firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Assuming Sunday is first day
                    const lastDayOfWeek = new Date(firstDayOfWeek);
                    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
                    return eventDate >= firstDayOfWeek && eventDate <= lastDayOfWeek;
                }
                case 'Last Month': {
                    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                    return eventDate >= firstDayOfLastMonth && eventDate <= lastDayOfLastMonth;
                }
                case 'Custom': {
                    if (!customStartDate || !customEndDate) return true;
                    
                    const [s_year, s_month, s_day] = customStartDate.split('-').map(Number);
                    const startDate = new Date(s_year, s_month - 1, s_day);
                    
                    const [e_year, e_month, e_day] = customEndDate.split('-').map(Number);
                    const endDate = new Date(e_year, e_month - 1, e_day);
                    
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return true;

                    return eventDate >= startDate && eventDate <= endDate;
                }
                case 'All':
                default:
                    return true;
            }
        };

        return appData.events.filter(event => {
            const matchesTag = tagFilter === 'All' || event.tags?.includes(tagFilter);
            const matchesDate = applyDateFilter(event);
            return matchesTag && matchesDate;
        });
    }, [appData.events, tagFilter, dateFilter, customStartDate, customEndDate]);

    const handleOpenWizard = () => setIsWizardOpen(true);
    const handleCloseWizard = () => setIsWizardOpen(false);

    const handleWizardSubmit = (fullEventData: NewFullEventData) => {
        onCreateFullEvent(fullEventData);
        handleCloseWizard();
    }
    
     const handleViewSampleDetails = (sample: CoffeeSample) => {
        setSelectedSample(sample);
        setIsSampleDetailModalOpen(true);
    };
    
    const handleInviteSubmit = (inviteData: UserInviteData) => {
        onInviteUsers(inviteData);
        setIsInviteModalOpen(false);
    }
    
    const handleExportCSV = () => {
        if (reportData.length === 0) return;
        const headers = ['Rank', 'Blind Code', 'Farm Name', 'Farmer', 'Region', 'Variety', 'Processing Method', 'Final Score'];
        const csvRows = [headers.join(',')];
        reportData.forEach((sample, index) => {
            const rank = index + 1;
            const farmer = appData.users.find(u => u.id === sample.farmerId)?.name || 'Unknown';
            const row = [
                rank,
                sample.blindCode,
                `"${sample.farmName.replace(/"/g, '""')}"`,
                `"${farmer.replace(/"/g, '""')}"`,
                `"${sample.region.replace(/"/g, '""')}"`,
                `"${sample.variety.replace(/"/g, '""')}"`,
                sample.processingMethod,
                sample.adjudicatedFinalScore?.toFixed(2)
            ].join(',');
            csvRows.push(row);
        });
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            const eventName = eventFilter === 'all' ? 'All-Events' : appData.events.find(e => e.id === eventFilter)?.name.replace(/\s+/g, '-') || 'Event';
            link.setAttribute('download', `results-${eventName}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const sortedSamples = useMemo(() => {
        let sortableItems = [...appData.samples];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'farmerName') {
                    aValue = appData.users.find(u => u.id === a.farmerId)?.name || '';
                    bValue = appData.users.find(u => u.id === b.farmerId)?.name || '';
                } else {
                    aValue = a[sortConfig.key as keyof CoffeeSample];
                    bValue = b[sortConfig.key as keyof CoffeeSample];
                }

                if (aValue === undefined || bValue === undefined) return 0;
                
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [appData.samples, appData.users, sortConfig]);

    const requestSort = (key: SortableSampleKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey }: { label: string, sortKey: SortableSampleKeys }) => {
        const isSorted = sortConfig?.key === sortKey;
        const sortIcon = isSorted ? (sortConfig?.direction === 'ascending' ? '▲' : '▼') : '';
        return (
            <th className="p-2">
                <button onClick={() => requestSort(sortKey)} className="font-bold w-full text-left flex items-center space-x-1 focus:outline-none">
                    <span>{label}</span>
                    <span className="text-primary">{sortIcon}</span>
                </button>
            </th>
        );
    };

    const TabButton = ({ tab, label, icon: Icon }: { tab: Tab, label: string, icon: React.ElementType }) => (
        <button
            onClick={() => { setActiveTab(tab); setViewingUserId(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 flex items-center space-x-2 ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-text-light hover:text-text-dark border-b-2 border-transparent'}`}
        >
            <Icon size={16} />
            <span>{label}</span>
        </button>
    );
    
    const rankColors: { [key: number]: string } = {
        1: 'border-yellow-400 bg-yellow-50',
        2: 'border-gray-400 bg-gray-50',
        3: 'border-orange-400 bg-orange-50',
    };

  return (
    <div>
        <h2 className="text-3xl font-bold mb-6">Administrator Dashboard</h2>
        <div className="border-b border-border mb-6">
            <nav className="-mb-px flex space-x-4">
                <TabButton tab="events" label="Cupping Events" icon={Coffee} />
                <TabButton tab="users" label="Manage Users" icon={Users} />
                <TabButton tab="samples" label="All Samples" icon={FileText} />
                <TabButton tab="results" label="Results & Reporting" icon={BarChart2} />
            </nav>
        </div>

        {activeTab === 'events' && (
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Cupping Events</h3>
                    <Button onClick={handleOpenWizard} className="flex items-center space-x-2"><UserPlus size={16}/><span>Create New Event</span></Button>
                </div>

                <div className="p-4 bg-background border border-border rounded-lg mb-4 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center space-x-2">
                        <Filter size={16} className="text-text-light" />
                        <span className="text-sm font-semibold text-text-dark">Filter by:</span>
                    </div>
                    <div>
                        <Label htmlFor="tag-filter" className="sr-only">Tag</Label>
                        <Select id="tag-filter" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
                            {allTags.map(tag => <option key={tag} value={tag}>{tag === 'All' ? 'All Tags' : tag}</option>)}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="date-filter" className="sr-only">Date</Label>
                        <Select id="date-filter" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                            <option value="All">All Time</option>
                            <option value="This Week">This Week</option>
                            <option value="Last Month">Last Month</option>
                            <option value="Custom">Custom Range</option>
                        </Select>
                    </div>
                    {dateFilter === 'Custom' && (
                        <div className="flex items-center gap-2">
                            <Input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="p-2 text-sm" aria-label="Start Date"/>
                            <span className="text-text-light">to</span>
                            <Input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="p-2 text-sm" aria-label="End Date"/>
                        </div>
                    )}
                </div>

                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="p-2">Name</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Tags</th>
                            <th className="p-2">Samples</th>
                            <th className="p-2">Status</th>
                            <th className="p-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.map(event => (
                            <tr key={event.id} className="border-b border-border hover:bg-background">
                                <td className="p-2">{event.name}</td>
                                <td className="p-2">{new Date(event.date + 'T00:00:00').toLocaleDateString()}</td>
                                <td className="p-2">
                                    <div className="flex flex-wrap gap-1">
                                        {event.tags?.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-2">{event.sampleIds.length}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${event.isResultsRevealed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {event.isResultsRevealed ? 'Revealed' : 'In Progress'}
                                    </span>
                                </td>
                                <td className="p-2 text-right">
                                     <Dropdown>
                                        <Dropdown.Trigger 
                                            disabled={event.isResultsRevealed} 
                                            title={event.isResultsRevealed ? "Event has been revealed and cannot be managed" : "Manage Event"}
                                        />
                                        <Dropdown.Content>
                                            <Dropdown.Item onClick={() => { setEventToEdit(event); setIsEditEventModalOpen(true); }}>
                                                <Edit size={14} className="text-text-light"/>
                                                <span>Edit Event Details</span>
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={() => { setEventToManageParticipants(event); setIsParticipantsModalOpen(true); }}>
                                                <Users size={14} className="text-text-light"/>
                                                <span>Manage Participants</span>
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={() => { setEventToManage(event); setIsManageEventModalOpen(true); }}>
                                                <FileText size={14} className="text-text-light"/>
                                                <span>Manage Samples</span>
                                            </Dropdown.Item>
                                            {!event.isResultsRevealed && (
                                                <>
                                                    <Dropdown.Separator />
                                                    <Dropdown.Item 
                                                        onClick={() => onRevealResults(event.id)} 
                                                        className="text-primary hover:bg-primary/10 font-semibold"
                                                    >
                                                        <Trophy size={14} />
                                                        <span>Reveal Results</span>
                                                    </Dropdown.Item>
                                                </>
                                            )}
                                        </Dropdown.Content>
                                    </Dropdown>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredEvents.length === 0 && <p className="text-center p-8 text-text-light">No events match the current filter.</p>}
            </Card>
        )}

        {activeTab === 'users' && (
            viewingUserId ? (
                <UserProfile
                    user={appData.users.find(u => u.id === viewingUserId)!}
                    activityLog={appData.activityLog.filter(l => l.userId === viewingUserId)}
                    onBack={() => setViewingUserId(null)}
                    onUpdateUser={(data) => onUpdateUser(viewingUserId, data)}
                    onUpdateStatus={(status) => onUpdateUsersStatus([viewingUserId], status)}
                />
            ) : (
                <UserManagement
                    users={appData.users}
                    events={appData.events}
                    onViewUser={setViewingUserId}
                    onInviteUser={() => setIsInviteModalOpen(true)}
                    onUpdateUsersStatus={onUpdateUsersStatus}
                    onAssignUsersToEvent={onAssignUsersToEvent}
                    onUpdateUserRoles={(userIds, roles) => userIds.forEach(id => onUpdateUser(id, { roles }))}
                />
            )
        )}

        {activeTab === 'samples' && (
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">All Coffee Samples</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="border-b border-border">
                                <SortableHeader label="Blind Code" sortKey="blindCode" />
                                <SortableHeader label="Region" sortKey="region" />
                                <SortableHeader label="Processing Method" sortKey="processingMethod" />
                                <SortableHeader label="Variety" sortKey="variety" />
                                <SortableHeader label="Farmer" sortKey="farmerName" />
                                <SortableHeader label="Moisture %" sortKey="moisture" />
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSamples.map(sample => {
                                const farmer = appData.users.find(u => u.id === sample.farmerId);
                                return (
                                    <tr key={sample.id} className="border-b border-border hover:bg-background">
                                        <td className="p-2 font-mono">{sample.blindCode}</td>
                                        <td className="p-2">{sample.region}</td>
                                        <td className="p-2">{sample.processingMethod}</td>
                                        <td className="p-2">{sample.variety}</td>
                                        <td className="p-2">{farmer?.name || 'Unknown'}</td>
                                        <td className="p-2">{sample.moisture ? `${sample.moisture}` : 'N/A'}</td>
                                        <td className="p-2">
                                            <Button onClick={() => handleViewSampleDetails(sample)} size="sm" variant="secondary">
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        )}

        {activeTab === 'results' && (
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-bold">Results & Analysis</h3>
                    <div className="flex items-center space-x-2">
                        <Select value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
                            <option value="all">All Events</option>
                            {revealedEvents.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}
                        </Select>
                        <Select value={processFilter} onChange={e => setProcessFilter(e.target.value)}>
                            {processingMethods.map(method => <option key={method} value={method}>{method}</option>)}
                        </Select>
                        <Button variant="secondary" onClick={handleExportCSV} className="flex items-center space-x-2"><Download size={16}/><span>Export CSV</span></Button>
                    </div>
                </div>
                
                {reportData.length > 0 ? (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-semibold mb-2">Top Performers</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {reportData.slice(0, 3).map((sample, index) => {
                                    const farmer = appData.users.find(u => u.id === sample.farmerId);
                                    return (
                                        <div key={sample.id} className={`p-4 rounded-lg border-2 ${rankColors[index+1] || 'border-border'}`}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-bold text-lg">{index + 1}. {sample.farmName}</p>
                                                    <p className="text-sm text-text-light">{farmer?.name}</p>
                                                </div>
                                                <Trophy size={24} className={index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-500' : 'text-orange-600'}/>
                                            </div>
                                            <p className="text-3xl font-bold text-primary mt-2">{sample.adjudicatedFinalScore?.toFixed(2)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card title="Score Distribution">
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={scoreDistributionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#FF7600" name="Number of Samples" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                             <Card title="Key Metrics">
                                <div className="grid grid-cols-2 gap-4 h-full content-center text-center">
                                    <div><p className="text-sm text-text-light">Total Samples</p><p className="text-3xl font-bold">{keyMetrics.count}</p></div>
                                    <div><p className="text-sm text-text-light">Average Score</p><p className="text-3xl font-bold">{keyMetrics.avg}</p></div>
                                    <div><p className="text-sm text-text-light">Highest Score</p><p className="text-3xl font-bold text-green-600">{keyMetrics.high}</p></div>
                                    <div><p className="text-sm text-text-light">Lowest Score</p><p className="text-3xl font-bold text-red-600">{keyMetrics.low}</p></div>
                                </div>
                            </Card>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold mb-2">Full Rankings</h4>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="p-2">Rank</th>
                                        <th className="p-2">Blind Code</th>
                                        <th className="p-2">Farm Name</th>
                                        <th className="p-2">Farmer</th>
                                        <th className="p-2">Processing</th>
                                        <th className="p-2">Final Score</th>
                                        <th className="p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((sample, index) => {
                                        const farmer = appData.users.find(u => u.id === sample.farmerId);
                                        return(
                                            <tr key={sample.id} className="border-b border-border hover:bg-background">
                                                <td className="p-2 font-bold text-lg">{index + 1}</td>
                                                <td className="p-2 font-mono">{sample.blindCode}</td>
                                                <td className="p-2">{sample.farmName}</td>
                                                <td className="p-2">{farmer?.name}</td>
                                                <td className="p-2">{sample.processingMethod}</td>
                                                <td className="p-2 font-bold text-primary">{sample.adjudicatedFinalScore?.toFixed(2)}</td>
                                                <td className="p-2">
                                                    <Button onClick={() => setViewingReportForSample(sample)} size="sm" variant="secondary" className="flex items-center space-x-1">
                                                        <FileText size={14} /> <span>Report</span>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-12 text-text-light">
                        <BarChart2 size={48} className="mx-auto mb-4"/>
                        <p>No finalized results found for the selected filter.</p>
                        <p className="text-sm">Please select a different event or wait for results to be revealed.</p>
                    </div>
                )}
            </Card>
        )}

        {/* Modals */}
        <EventCreationWizard 
            isOpen={isWizardOpen} 
            onClose={handleCloseWizard} 
            onSubmit={handleWizardSubmit}
            appData={appData}
        />
        
        <EventManagementModal
            isOpen={isManageEventModalOpen}
            onClose={() => setIsManageEventModalOpen(false)}
            event={eventToManage}
            appData={appData}
            onUpdate={onUpdateEventSamples}
        />

        <EventEditModal
            isOpen={isEditEventModalOpen}
            onClose={() => setIsEditEventModalOpen(false)}
            event={eventToEdit}
            onUpdate={onUpdateEventDetails}
        />
        
        <EventParticipantsModal
            isOpen={isParticipantsModalOpen}
            onClose={() => setIsParticipantsModalOpen(false)}
            event={eventToManageParticipants}
            appData={appData}
            onUpdate={onUpdateEventParticipants}
        />

        <UserInvitationModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            onSubmit={handleInviteSubmit}
            events={appData.events}
        />

        <Modal isOpen={isSampleDetailModalOpen} onClose={() => setIsSampleDetailModalOpen(false)} title={`Sample Details: ${selectedSample?.blindCode}`}>
            {selectedSample && (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold">Sample Information</h4>
                        <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                            <span className="text-text-light">Farmer:</span><span>{appData.users.find(u => u.id === selectedSample.farmerId)?.name}</span>
                            <span className="text-text-light">Farm Name:</span><span>{selectedSample.farmName}</span>
                            <span className="text-text-light">Region:</span><span>{selectedSample.region}</span>
                            <span className="text-text-light">Altitude (m):</span><span>{selectedSample.altitude}</span>
                            <span className="text-text-light">Processing:</span><span>{selectedSample.processingMethod}</span>
                            <span className="text-text-light">Variety:</span><span>{selectedSample.variety}</span>
                            <span className="text-text-light">Moisture:</span><span>{selectedSample.moisture ? `${selectedSample.moisture}%` : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4">
                         <h4 className="font-bold">Q Grader Scores</h4>
                         {(() => {
                            const eventForSample = appData.events.find(e => e.sampleIds.includes(selectedSample.id));
                            if (!eventForSample) {
                                return <p className="text-sm text-text-light mt-2">This sample is not assigned to an event.</p>;
                            }
                            if (!eventForSample.isResultsRevealed) {
                                return <p className="text-sm text-text-light mt-2">Scores are hidden until results are revealed for the event "{eventForSample.name}".</p>;
                            }
                            const scores = appData.scores.filter(s => s.sampleId === selectedSample.id && s.eventId === eventForSample.id && s.isSubmitted);
                             if (scores.length === 0) {
                                return <p className="text-sm text-text-light mt-2">No scores have been submitted for this sample yet.</p>;
                            }

                            return (
                                <div className="space-y-3 mt-2">
                                    {scores.map(score => {
                                        const grader = appData.users.find(u => u.id === score.qGraderId);
                                        return (
                                            <div key={score.id} className="p-3 bg-background rounded-md border border-border">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold">{grader?.name || 'Unknown Grader'}</span>
                                                    <span className="font-bold text-primary">{score.scores.finalScore.toFixed(2)}</span>
                                                </div>
                                                <p className="text-sm text-text-light italic mt-1">"{score.notes}"</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                         })()}
                    </div>
                </div>
            )}
        </Modal>

        <Modal isOpen={!!viewingReportForSample} onClose={() => setViewingReportForSample(null)} title="Official Cupping Report" size="xl">
            {viewingReportForSample && (
                <SampleReport
                    sample={viewingReportForSample}
                    appData={appData}
                />
            )}
        </Modal>
    </div>
  );
};

export default AdminDashboard;
