
export enum Role {
  ADMIN = 'Administrator',
  Q_GRADER = 'Q Grader',
  HEAD_JUDGE = 'Head Judge',
  FARMER = 'Farmer',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roles: Role[];
  status: 'Active' | 'Pending Invitation' | 'Deactivated';
  lastLogin: string; // ISO Date string
  profilePictureUrl?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  timestamp: string; // ISO Date string
  action: string;
  performedBy: string; // User ID
}

export interface CoffeeSample {
  id: string;
  farmerId: string;
  blindCode: string;
  farmName: string;
  region: string;
  altitude: number;
  processingMethod: string;
  variety: string;
  moisture?: number;
  adjudicatedFinalScore?: number;
  gradeLevel?: string;
  headJudgeNotes?: string;
  adjudicationJustification?: string;
  flaggedForDiscussion?: boolean;
}

export interface CuppingScore {
  fragrance: number;
  flavor: number;
  aftertaste: number;
  acidity: number;
  body: number;
  balance: number;
  uniformity: number;
  cleanCup: number;
  sweetness: number;
  overall: number;
  taints: number; // Number of cups with taints
  faults: number; // Number of cups with faults
  finalScore: number;
}

export interface Descriptor {
  name: string;
  intensity: number; // e.g., on a scale of 1-5
}

export interface ScoreSheet {
  id: string;
  qGraderId: string;
  sampleId: string;
  eventId: string;
  scores: CuppingScore;
  descriptors: Descriptor[];
  notes: string; // For final comments / voice dictation
  isSubmitted: boolean;
}

export interface CuppingEvent {
  id: string;
  name: string;
  date: string; // Consider changing to { startDate: string, endDate: string }
  description?: string;
  processingMethods?: string[];
  assignedQGraderIds: string[];
  assignedHeadJudgeIds: string[];
  sampleIds: string[];
  isResultsRevealed: boolean;
  tags?: string[];
  registrationOpen?: boolean;
}