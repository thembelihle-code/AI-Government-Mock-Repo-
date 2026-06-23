import type { Proposal, CreateProposalPayload } from '../types/proposal';

const BASE = 'http://localhost:4000';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

export const proposalAdapter = {
  getAll: (): Promise<Proposal[]> =>
    fetch(`${BASE}/api/proposals`).then(handle<Proposal[]>),

  create: (payload: CreateProposalPayload): Promise<Proposal> =>
    fetch(`${BASE}/api/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle<Proposal>),

  markEligible: (id: number): Promise<Proposal> =>
    fetch(`${BASE}/api/proposals/${id}/eligibility`, {
      method: 'PATCH',
    }).then(handle<Proposal>),

  runAIReview: (id: number): Promise<Proposal> =>
    fetch(`${BASE}/api/proposals/${id}/ai-review`, {
      method: 'POST',
    }).then(handle<Proposal>),

  setDecision: (id: number, decision: 'Fund' | 'Waitlist' | 'Decline'): Promise<Proposal> =>
    fetch(`${BASE}/api/proposals/${id}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    }).then(handle<Proposal>),

  notifyAll: (): Promise<{ notified: number }> =>
    fetch(`${BASE}/api/notify`, { method: 'POST' }).then(handle<{ notified: number }>),
};