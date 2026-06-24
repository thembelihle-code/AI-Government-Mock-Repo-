export type ProposalStatus = 'submitted' | 'eligible' | 'reviewed' | 'notified';
export type ProposalDecision = 'Fund' | 'Waitlist' | 'Decline';

export interface Proposal {
  id: number;
  title: string;
  pi: string;
  category: string | null;
  abstract: string | null;
  amount: number;
  status: ProposalStatus;
  aiScore: number | null;
  decision: ProposalDecision | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProposalPayload {
  title: string;
  pi: string;
  category?: string;
  abstract?: string;
  amount?: number;
}