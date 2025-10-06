import React, { useState, useCallback } from 'react';
import { Role, User, ScoreSheet, CoffeeSample, CuppingEvent, ActivityLog } from './types';
import { initialData, AppData } from './data';

import LoginScreen from './components/auth/LoginScreen';
import AdminDashboard from './components/dashboards/AdminDashboard';
import QGraderDashboard from './components/dashboards/QGraderDashboard';
import HeadJudgeDashboard from './components/dashboards/HeadJudgeDashboard';
import FarmerDashboard from './components/dashboards/FarmerDashboard';
import Header from './components/ui/Header';
import PublicLeaderboard from './components/reporting/PublicLeaderboard';

export interface AdjudicationData {
    score?: number;
    grade?: string;
    notes?: string;
    justification?: string;
    flagged?: boolean;
}

export interface NewFullEventData {
    eventDetails: Omit<CuppingEvent, 'id' | 'sampleIds' | 'isResultsRevealed' | 'assignedQGraderIds' | 'assignedHeadJudgeIds'>;
    assignedQGraderIds: string[];
    assignedHeadJudgeIds: string[];
    samples: Omit<CoffeeSample, 'id' | 'blindCode'>[];
}

export interface UserInviteData {
  emails: string[];
  roles: Role[];
  eventId?: string;
}

export interface UserUpdateData {
  name?: string;
  phone?: string;
  roles?: Role[];
}

export interface NewSampleRegistrationData {
    farmName: string;
    region: string;
    altitude: number;
    processingMethod: string;
    variety: string;
    moisture?: number;
}

export interface EventSamplesUpdateData {
  eventId: string;
  samples: CoffeeSample[]; // Full list of samples for the event, new ones will not have an ID
}

export type EventDetailsUpdateData = Omit<CuppingEvent, 'id' | 'sampleIds' | 'isResultsRevealed' | 'assignedQGraderIds' | 'assignedHeadJudgeIds'>;

export interface EventParticipantsUpdateData {
  eventId: string;
  assignedQGraderIds: string[];
  assignedHeadJudgeIds: string[];
}


function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appData, setAppData] = useState<AppData>(initialData);
  const [isPublicView, setIsPublicView] = useState(false);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleShowLeaderboard = () => {
    setIsPublicView(true);
  }

  const handleExitLeaderboard = () => {
    setIsPublicView(false);
  }

  const updateScoreSheet = useCallback((updatedSheet: ScoreSheet) => {
    setAppData(prevData => {
      const scoreExists = prevData.scores.some(s => s.id === updatedSheet.id);

      if (scoreExists) {
        // Update existing score sheet
        return {
          ...prevData,
          scores: prevData.scores.map(s => s.id === updatedSheet.id ? updatedSheet : s),
        };
      } else {
        // Add new score sheet, assigning a permanent ID
        const newSheetWithProperId = {
          ...updatedSheet,
          id: `scoresheet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        return {
          ...prevData,
          scores: [...prevData.scores, newSheetWithProperId],
        };
      }
    });
  }, []);

  const revealResults = useCallback((eventId: string) => {
    setAppData(prevData => ({
      ...prevData,
      events: prevData.events.map(e => e.id === eventId ? { ...e, isResultsRevealed: true } : e)
    }));
  }, []);

  const inviteUsers = useCallback((inviteData: UserInviteData) => {
    if (!currentUser) return;
    setAppData(prevData => {
      const newUsers: User[] = inviteData.emails.map(email => ({
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: email.split('@')[0], // Default name
        email,
        roles: inviteData.roles,
        status: 'Pending Invitation',
        lastLogin: '',
      }));

      const newLogs: ActivityLog[] = newUsers.map(user => ({
        id: `log-${Date.now()}-${user.id}`,
        userId: user.id,
        timestamp: new Date().toISOString(),
        action: 'Invitation Sent',
        performedBy: currentUser!.id,
      }));

      let updatedEvents = prevData.events;
      if (inviteData.eventId && inviteData.eventId !== 'none') {
        updatedEvents = prevData.events.map(event => {
          if (event.id === inviteData.eventId) {
            const newGraderIds = newUsers.filter(u => u.roles.includes(Role.Q_GRADER)).map(u => u.id);
            const newJudgeIds = newUsers.filter(u => u.roles.includes(Role.HEAD_JUDGE)).map(u => u.id);

            return {
              ...event,
              assignedQGraderIds: [...new Set([...event.assignedQGraderIds, ...newGraderIds])],
              assignedHeadJudgeIds: [...new Set([...event.assignedHeadJudgeIds, ...newJudgeIds])],
            };
          }
          return event;
        });
      }

      return {
        ...prevData,
        users: [...prevData.users, ...newUsers],
        activityLog: [...prevData.activityLog, ...newLogs],
        events: updatedEvents,
      };
    });
  }, [currentUser]);
  
  const updateUser = useCallback((userId: string, updateData: UserUpdateData) => {
    if (!currentUser) return;
    setAppData(prevData => {
      let logAction = 'Profile updated';
      if (updateData.roles) logAction = 'Roles updated';

      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        userId: userId,
        timestamp: new Date().toISOString(),
        action: logAction,
        performedBy: currentUser.id,
      };

      return {
        ...prevData,
        users: prevData.users.map(u => 
          u.id === userId ? { ...u, ...updateData } : u
        ),
        activityLog: [...prevData.activityLog, newLog],
      };
    });
  }, [currentUser]);

  const updateUsersStatus = useCallback((userIds: string[], status: User['status']) => {
    if (!currentUser) return;
    setAppData(prevData => {
       const newLogs: ActivityLog[] = userIds.map(uid => ({
            id: `log-${Date.now()}-${uid}`,
            userId: uid,
            timestamp: new Date().toISOString(),
            action: status === 'Active' ? 'Account Re-activated' : status === 'Deactivated' ? 'Account Deactivated' : 'Invitation Resent',
            performedBy: currentUser.id,
       }));
       return {
            ...prevData,
            users: prevData.users.map(u => 
                userIds.includes(u.id) ? { ...u, status } : u
            ),
            activityLog: [...prevData.activityLog, ...newLogs],
       }
    });
  }, [currentUser]);

  const assignUsersToEvent = useCallback((userIds: string[], eventId: string) => {
      if(!currentUser) return;
      setAppData(prevData => {
        const usersToAssign = prevData.users.filter(u => userIds.includes(u.id));
        const newLogs: ActivityLog[] = userIds.map(uid => ({
            id: `log-${Date.now()}-${uid}`,
            userId: uid,
            timestamp: new Date().toISOString(),
            action: `Assigned to event`,
            performedBy: currentUser.id,
        }));

        return {
            ...prevData,
            events: prevData.events.map(event => {
                if (event.id === eventId) {
                    const newGraderIds = usersToAssign.filter(u => u.roles.includes(Role.Q_GRADER)).map(u => u.id);
                    const newJudgeIds = usersToAssign.filter(u => u.roles.includes(Role.HEAD_JUDGE)).map(u => u.id);
                    return {
                        ...event,
                        assignedQGraderIds: [...new Set([...event.assignedQGraderIds, ...newGraderIds])],
                        assignedHeadJudgeIds: [...new Set([...event.assignedHeadJudgeIds, ...newJudgeIds])],
                    };
                }
                return event;
            }),
            activityLog: [...prevData.activityLog, ...newLogs],
        };
      });
  }, [currentUser]);

  const generateBlindCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    let code = '';
    do {
        code = `${chars.charAt(Math.floor(Math.random() * chars.length))}${nums.charAt(Math.floor(Math.random() * nums.length))}${chars.charAt(Math.floor(Math.random() * chars.length))}${nums.charAt(Math.floor(Math.random() * nums.length))}`;
    } while (appData.samples.some(s => s.blindCode === code));
    return code;
  }, [appData.samples]);

  const createFullEvent = useCallback((fullEventData: NewFullEventData) => {
    const newSamples: CoffeeSample[] = fullEventData.samples.map((sample, index) => ({
        ...sample,
        id: `sample-${Date.now()}-${index}`,
        blindCode: generateBlindCode(),
    }));

    const newEvent: CuppingEvent = {
        ...fullEventData.eventDetails,
        id: `event-${Date.now()}`,
        assignedQGraderIds: fullEventData.assignedQGraderIds,
        assignedHeadJudgeIds: fullEventData.assignedHeadJudgeIds,
        sampleIds: newSamples.map(s => s.id),
        isResultsRevealed: false,
    };
    
    setAppData(prevData => ({
        ...prevData,
        events: [...prevData.events, newEvent],
        samples: [...prevData.samples, ...newSamples],
    }));

  }, [appData.samples, generateBlindCode]);

  const updateEventDetails = useCallback((eventId: string, updateData: EventDetailsUpdateData) => {
    setAppData(prevData => ({
        ...prevData,
        events: prevData.events.map(e => 
            e.id === eventId ? { ...e, ...updateData } : e
        )
    }));
  }, []);
  
  const updateEventParticipants = useCallback((updateData: EventParticipantsUpdateData) => {
    setAppData(prevData => ({
      ...prevData,
      events: prevData.events.map(e =>
        e.id === updateData.eventId ? { 
          ...e, 
          assignedQGraderIds: updateData.assignedQGraderIds,
          assignedHeadJudgeIds: updateData.assignedHeadJudgeIds,
        } : e
      )
    }));
  }, []);

  const updateEventSamples = useCallback((updateData: EventSamplesUpdateData) => {
    const { eventId, samples: finalSamples } = updateData;

    setAppData(prevData => {
        const eventToUpdate = prevData.events.find(e => e.id === eventId);
        if (!eventToUpdate) return prevData;

        const originalSampleIds = new Set(eventToUpdate.sampleIds);
        const finalSampleIds = new Set<string>();
        
        const processedSamples = finalSamples.map(sample => {
            if (prevData.samples.some(s => s.id === sample.id)) {
                // It's an existing sample being updated.
                finalSampleIds.add(sample.id);
                return sample;
            } else {
                // It's a new sample.
                const newSample: CoffeeSample = {
                    ...sample,
                    id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    blindCode: generateBlindCode(),
                };
                finalSampleIds.add(newSample.id);
                return newSample;
            }
        });
        
        const deletedSampleIds = [...originalSampleIds].filter(id => !finalSampleIds.has(id));

        let updatedGlobalSamples = prevData.samples
            .filter(s => !deletedSampleIds.includes(s.id))
            .map(s => processedSamples.find(ps => ps.id === s.id) || s);
        
        const newSamplesToAdd = processedSamples.filter(s => !originalSampleIds.has(s.id));
        updatedGlobalSamples.push(...newSamplesToAdd);

        const updatedEvents = prevData.events.map(event => {
            if (event.id === eventId) {
                return { ...event, sampleIds: Array.from(finalSampleIds) };
            }
            return event;
        });

        return {
            ...prevData,
            samples: updatedGlobalSamples,
            events: updatedEvents,
        };
    });
}, [generateBlindCode]);

  const updateSampleAdjudication = useCallback((sampleId: string, finalData: AdjudicationData) => {
    setAppData(prevData => ({
      ...prevData,
      samples: prevData.samples.map(s => 
        s.id === sampleId 
        ? { 
            ...s, 
            adjudicatedFinalScore: finalData.score ?? s.adjudicatedFinalScore, 
            gradeLevel: finalData.grade ?? s.gradeLevel, 
            headJudgeNotes: finalData.notes ?? s.headJudgeNotes,
            adjudicationJustification: finalData.justification ?? s.adjudicationJustification,
            flaggedForDiscussion: finalData.flagged ?? s.flaggedForDiscussion,
          } 
        : s
      ),
    }));
  }, []);
  
  const registerForEvent = useCallback((eventId: string, sampleData: NewSampleRegistrationData) => {
    if (!currentUser || !currentUser.roles.includes(Role.FARMER)) return;

    const newSample: CoffeeSample = {
        ...sampleData,
        id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        farmerId: currentUser.id,
        blindCode: 'PENDING', // Admin will assign this later
    };

    setAppData(prevData => {
        const updatedEvents = prevData.events.map(event => {
            if (event.id === eventId) {
                return {
                    ...event,
                    sampleIds: [...event.sampleIds, newSample.id],
                };
            }
            return event;
        });

        return {
            ...prevData,
            samples: [...prevData.samples, newSample],
            events: updatedEvents,
        };
    });
  }, [currentUser]);


  const renderDashboard = () => {
    if (!currentUser) return null;

    // Use the primary role (first in the array) to determine which dashboard to show.
    switch (currentUser.roles[0]) {
      case Role.ADMIN:
        return <AdminDashboard 
            currentUser={currentUser} 
            appData={appData} 
            onRevealResults={revealResults}
            onCreateFullEvent={createFullEvent}
            onInviteUsers={inviteUsers}
            onUpdateUser={updateUser}
            onUpdateUsersStatus={updateUsersStatus}
            onAssignUsersToEvent={assignUsersToEvent}
            onUpdateEventSamples={updateEventSamples}
            onUpdateEventDetails={updateEventDetails}
            onUpdateEventParticipants={updateEventParticipants}
        />;
      case Role.Q_GRADER:
        return <QGraderDashboard currentUser={currentUser} appData={appData} onUpdateScoreSheet={updateScoreSheet} />;
      case Role.HEAD_JUDGE:
        return <HeadJudgeDashboard currentUser={currentUser} appData={appData} onUpdateAdjudication={updateSampleAdjudication} />;
      case Role.FARMER:
        return <FarmerDashboard 
            currentUser={currentUser} 
            appData={appData} 
            onRegisterForEvent={registerForEvent}
        />;
      default:
        return <div>Invalid Role</div>;
    }
  };

  if (isPublicView) {
    return <PublicLeaderboard appData={appData} onExit={handleExitLeaderboard} />;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-text-dark">
      {currentUser ? (
        <>
          <Header user={currentUser} onLogout={handleLogout} />
          <main className="p-4 sm:p-6 lg:p-8">
            {renderDashboard()}
          </main>
        </>
      ) : (
        <LoginScreen users={appData.users} onLogin={handleLogin} onShowLeaderboard={handleShowLeaderboard} />
      )}
    </div>
  );
}

export default App;