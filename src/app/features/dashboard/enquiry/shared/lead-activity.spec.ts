import { describe, expect, it } from 'vitest';
import { Enquiry, UserRef } from '../../../../core/models/enquiry.model';
import {
  buildTimeline,
  followUpPresets,
  followUpState,
  personId,
  personName,
  toDateTimeLocal,
} from './lead-activity';

const user = (id: string, firstName: string, lastName = ''): UserRef => ({ _id: id, firstName, lastName });

const lead = (over: Partial<Enquiry> = {}): Enquiry => ({
  _id: 'e1',
  name: 'Jordan',
  phone: '9876500000',
  source: 'website',
  status: 'new',
  notes: [],
  activities: [],
  createdAt: '2026-10-01T09:00:00.000Z',
  ...over,
});

describe('personName / personId', () => {
  it('formats a populated user and falls back for ids or missing values', () => {
    expect(personName(user('1', 'Priya', 'Verma'))).toBe('Priya Verma');
    expect(personName(user('1', 'Priya'))).toBe('Priya');
    expect(personName('507f1f77bcf86cd799439011')).toBe('Someone');
    expect(personName(null, 'Unassigned')).toBe('Unassigned');
    expect(personName(undefined)).toBe('Someone');
  });

  it('reads the id from a populated ref or a plain id', () => {
    expect(personId(user('abc', 'X'))).toBe('abc');
    expect(personId('abc')).toBe('abc');
    expect(personId(null)).toBe('');
  });
});

describe('buildTimeline', () => {
  it('is empty for a lead with nothing recorded', () => {
    expect(buildTimeline(lead())).toEqual([]);
  });

  it('merges remarks and activity into one feed, newest first', () => {
    const items = buildTimeline(
      lead({
        activities: [
          { type: 'created', at: '2026-10-01T09:00:00.000Z' },
          { type: 'assigned', at: '2026-10-01T10:00:00.000Z', actor: user('a', 'Admin'), assignedTo: user('s', 'Sam', 'Sales') },
          { type: 'status_changed', at: '2026-10-03T10:00:00.000Z', actor: user('s', 'Sam'), statusFrom: 'new', statusTo: 'in-progress' },
        ],
        notes: [{ text: 'Called, wants a demo', addedBy: user('s', 'Sam'), createdAt: '2026-10-02T10:00:00.000Z' }],
      })
    );

    expect(items.map((i) => i.kind)).toEqual(['status', 'remark', 'assigned', 'created']);
  });

  it('describes a website lead, a staff-added lead, and who assigned it', () => {
    const items = buildTimeline(
      lead({
        activities: [
          { type: 'created', at: '2026-10-01T09:00:00.000Z' },
          { type: 'created', at: '2026-10-01T09:30:00.000Z', actor: user('s', 'Sam') },
        ],
      })
    );
    expect(items.map((i) => [i.title, i.actor])).toEqual([
      ['Lead added', 'Sam'],
      ['Lead received from the website form', 'Website form'],
    ]);
  });

  it('words assignment, reassignment and unassignment distinctly', () => {
    const at = (h: number) => `2026-10-01T0${h}:00:00.000Z`;
    const items = buildTimeline(
      lead({
        activities: [
          { type: 'assigned', at: at(1), actor: user('a', 'Admin'), assignedTo: user('s', 'Sam') },
          { type: 'assigned', at: at(2), actor: user('a', 'Admin'), assignedFrom: user('s', 'Sam'), assignedTo: user('v', 'Vik') },
          { type: 'assigned', at: at(3), actor: user('a', 'Admin'), assignedFrom: user('v', 'Vik'), assignedTo: null },
        ],
      })
    );
    expect(items.map((i) => i.title)).toEqual(['Unassigned', 'Reassigned from Sam to Vik', 'Assigned to Sam']);
  });

  it('humanises status changes', () => {
    const [item] = buildTimeline(
      lead({ activities: [{ type: 'status_changed', at: '2026-10-01T09:00:00.000Z', statusFrom: 'new', statusTo: 'in-progress' }] })
    );
    expect(item.title).toBe('Status changed from New to In progress');
  });

  it('shows a remark that scheduled a follow-up, and a completed follow-up with its outcome', () => {
    const items = buildTimeline(
      lead({
        notes: [
          { text: 'Call after the festival', addedBy: user('s', 'Sam'), followUpAt: '2026-10-10T10:00:00.000Z', createdAt: '2026-10-02T10:00:00.000Z' },
        ],
        activities: [
          { type: 'followup_done', at: '2026-10-10T11:00:00.000Z', actor: user('s', 'Sam'), followUpAt: '2026-10-10T10:00:00.000Z', text: 'Sent the quote' },
        ],
      })
    );

    expect(items[0]).toMatchObject({ kind: 'followup_done', title: 'Follow-up marked done', body: 'Sent the quote' });
    expect(items[1]).toMatchObject({ kind: 'remark', title: 'Remark · follow-up scheduled', body: 'Call after the festival', followUpAt: '2026-10-10T10:00:00.000Z' });
  });

  it('copes with older leads that have remarks but no activity log', () => {
    const items = buildTimeline(
      lead({ activities: undefined, notes: [{ text: 'Legacy note', addedBy: 'someone-id', createdAt: '2026-09-01T00:00:00.000Z' }] })
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: 'remark', actor: 'Someone', body: 'Legacy note' });
  });
});

describe('followUpState', () => {
  // Fixed local "now": 5 Oct 2026, 3:30 pm.
  const now = new Date(2026, 9, 5, 15, 30);

  it('is overdue before today, even by a few hours the day before', () => {
    expect(followUpState(new Date(2026, 9, 4, 23, 59).toISOString(), now)).toBe('overdue');
    expect(followUpState(new Date(2026, 8, 20).toISOString(), now)).toBe('overdue');
  });

  it('is "today" for any time today — including earlier this morning', () => {
    expect(followUpState(new Date(2026, 9, 5, 0, 0).toISOString(), now)).toBe('today');
    expect(followUpState(new Date(2026, 9, 5, 9, 0).toISOString(), now)).toBe('today');
    expect(followUpState(new Date(2026, 9, 5, 23, 59).toISOString(), now)).toBe('today');
  });

  it('is upcoming from tomorrow onwards', () => {
    expect(followUpState(new Date(2026, 9, 6, 0, 0).toISOString(), now)).toBe('upcoming');
    expect(followUpState(new Date(2026, 10, 1).toISOString(), now)).toBe('upcoming');
  });
});

describe('follow-up pickers', () => {
  it('formats a local date-time for <input type="datetime-local">', () => {
    expect(toDateTimeLocal(new Date(2026, 0, 2, 3, 4))).toBe('2026-01-02T03:04');
  });

  it('offers tomorrow / in 3 days / next week at 10:00 local time, crossing month ends correctly', () => {
    const presets = followUpPresets(new Date(2026, 9, 30, 15, 30)); // 30 Oct
    expect(presets).toEqual([
      { label: 'Tomorrow', value: '2026-10-31T10:00' },
      { label: 'In 3 days', value: '2026-11-02T10:00' },
      { label: 'Next week', value: '2026-11-06T10:00' },
    ]);
  });
});
