import { describe, expect, it } from 'vitest';
import { ENQUIRY_STATUSES } from '../../../../core/models/enquiry.model';
import { buildTimeline } from './lead-activity';
import { formatEnumLabel } from '../../../../shared/utils/format-label';

describe('enquiry statuses', () => {
  it('has "interested" between contacted and in-progress', () => {
    expect(ENQUIRY_STATUSES).toEqual([
      'new',
      'contacted',
      'interested',
      'in-progress',
      'converted',
      'lost',
      'wrong',
      'closed',
    ]);
  });

  it('labels it "Interested"', () => {
    expect(formatEnumLabel('interested')).toBe('Interested');
  });

  it('describes a change to it in the lead timeline', () => {
    const [item] = buildTimeline({
      _id: 'e1',
      name: 'Jordan',
      phone: '9876500000',
      source: 'website',
      status: 'interested',
      notes: [],
      createdAt: '2026-10-07T09:00:00.000Z',
      activities: [
        { type: 'status_changed', at: '2026-10-07T10:00:00.000Z', statusFrom: 'contacted', statusTo: 'interested' },
      ],
    });
    expect(item.title).toBe('Status changed from Contacted to Interested');
  });
});
