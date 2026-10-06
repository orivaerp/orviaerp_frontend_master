import { Enquiry, UserRef } from '../../../../core/models/enquiry.model';
import { formatEnumLabel } from '../../../../shared/utils/format-label';

export function personName(ref: UserRef | string | null | undefined, fallback = 'Someone'): string {
  if (!ref) return fallback;
  if (typeof ref === 'string') return fallback;
  return `${ref.firstName} ${ref.lastName ?? ''}`.trim();
}

export function personId(ref: UserRef | string | null | undefined): string {
  if (!ref) return '';
  return typeof ref === 'string' ? ref : ref._id;
}

export type TimelineKind = 'remark' | 'created' | 'assigned' | 'status' | 'followup_done';

export interface TimelineItem {
  kind: TimelineKind;
  at: string;
  /** Who did it. */
  actor: string;
  /** One-line description of what happened ("Assigned to Priya"). */
  title: string;
  /** Free text: the remark itself, or the outcome noted when a follow-up was completed. */
  body?: string;
  /** A follow-up this entry scheduled (remarks) or closed (follow-up done). */
  followUpAt?: string;
}

/**
 * One chronological feed (newest first) of everything that happened on a lead:
 * remarks (stored as notes) merged with the system-recorded activity.
 */
export function buildTimeline(enquiry: Enquiry): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const note of enquiry.notes ?? []) {
    items.push({
      kind: 'remark',
      at: note.createdAt,
      actor: personName(note.addedBy),
      title: note.followUpAt ? 'Remark · follow-up scheduled' : 'Remark',
      body: note.text,
      followUpAt: note.followUpAt,
    });
  }

  for (const activity of enquiry.activities ?? []) {
    const actor = personName(activity.actor, '');
    switch (activity.type) {
      case 'created':
        items.push({
          kind: 'created',
          at: activity.at,
          actor: actor || 'Website form',
          title: actor ? 'Lead added' : 'Lead received from the website form',
        });
        break;
      case 'assigned': {
        const to = personName(activity.assignedTo, '');
        const from = personName(activity.assignedFrom, '');
        const title = !to
          ? 'Unassigned'
          : from
            ? `Reassigned from ${from} to ${to}`
            : `Assigned to ${to}`;
        items.push({ kind: 'assigned', at: activity.at, actor: actor || 'System', title });
        break;
      }
      case 'status_changed':
        items.push({
          kind: 'status',
          at: activity.at,
          actor: actor || 'System',
          title: `Status changed from ${formatEnumLabel(activity.statusFrom ?? '')} to ${formatEnumLabel(activity.statusTo ?? '')}`,
        });
        break;
      case 'followup_done':
        items.push({
          kind: 'followup_done',
          at: activity.at,
          actor: actor || 'System',
          title: 'Follow-up marked done',
          body: activity.text,
          followUpAt: activity.followUpAt,
        });
        break;
    }
  }

  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export type FollowUpState = 'overdue' | 'today' | 'upcoming';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Where a follow-up falls relative to *today in the viewer's timezone* (matches the server's buckets). */
export function followUpState(iso: string, now: Date = new Date()): FollowUpState {
  const due = new Date(iso);
  const today = startOfDay(now);
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (due < today) return 'overdue';
  if (due < tomorrow) return 'today';
  return 'upcoming';
}

/** Value for <input type="datetime-local"> (local time, no seconds) from a Date. */
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Quick follow-up choices, all at 10:00 local time. */
export function followUpPresets(now: Date = new Date()): { label: string; value: string }[] {
  const at10 = (daysAhead: number) =>
    toDateTimeLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, 10, 0));
  return [
    { label: 'Tomorrow', value: at10(1) },
    { label: 'In 3 days', value: at10(3) },
    { label: 'Next week', value: at10(7) },
  ];
}
