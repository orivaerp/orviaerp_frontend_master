export type EnquiryStatus =
  'new' | 'contacted' | 'interested' | 'in-progress' | 'converted' | 'lost' | 'wrong' | 'closed';

export const ENQUIRY_STATUSES: EnquiryStatus[] = [
  'new',
  'contacted',
  'interested',
  'in-progress',
  'converted',
  'lost',
  'wrong',
  'closed',
];

export type EnquirySource =
  | 'walkin'
  | 'website'
  | 'campaign'
  | 'websearch'
  | 'direct'
  | 'reference'
  | 'social-media'
  | 'email'
  | 'phone-call'
  | 'advertisement'
  | 'event'
  | 'other';

export const ENQUIRY_SOURCES: EnquirySource[] = [
  'walkin',
  'website',
  'campaign',
  'websearch',
  'direct',
  'reference',
  'social-media',
  'email',
  'phone-call',
  'advertisement',
  'event',
  'other',
];

export type EnquiryCategory = 'health' | 'education' | 'transport' | 'retail' | 'portfolio';

export const ENQUIRY_CATEGORIES: EnquiryCategory[] = [
  'health',
  'education',
  'transport',
  'retail',
  'portfolio',
];

/** Suggested sub-categories per domain — shown as datalist hints; the field itself is free text. */
export const ENQUIRY_SUBCATEGORY_SUGGESTIONS: Record<EnquiryCategory, string[]> = {
  health: [
    'Hospital',
    'Clinic',
    'Pharmacy',
    'Diagnostic Center',
    'Wellness Center',
    'Physio Clinic',
    'Dental Clinic',
  ],
  education: ['School', 'College', 'Coaching Institute', 'Online Course', 'Training Center'],
  transport: ['Logistics', 'Cab Service', 'Courier', 'Fleet Management', 'Freight'],
  retail: ['Retail Store', 'Supermarket', 'E-commerce', 'Wholesale', 'Showroom'],
  portfolio: [
    'Personal Portfolio',
    'Agency Portfolio',
    'Freelancer Portfolio',
    'Photography Portfolio',
  ],
};

/** A populated user reference (assignee, author, actor …) — or just the id if not populated. */
export interface UserRef {
  _id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export interface EnquiryNote {
  text: string;
  addedBy?: UserRef | string;
  /** Set when the remark also scheduled a follow-up. */
  followUpAt?: string;
  createdAt: string;
}

export type EnquiryActivityType = 'created' | 'assigned' | 'status_changed' | 'followup_done';

/** System-recorded event on a lead. Remarks live in `notes`; the timeline merges both. */
export interface EnquiryActivity {
  type: EnquiryActivityType;
  actor?: UserRef | string | null;
  at: string;
  statusFrom?: string;
  statusTo?: string;
  assignedFrom?: UserRef | string | null;
  assignedTo?: UserRef | string | null;
  followUpAt?: string;
  text?: string;
}

export type FollowUpFilter = 'overdue' | 'today' | 'upcoming' | 'pending';

export interface Enquiry {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  message?: string;
  product?: { _id: string; name: string; slug: string } | string | null;
  subject?: string;
  source: EnquirySource;
  category?: EnquiryCategory;
  subCategory?: string;
  firmName?: string;
  website?: string;
  city?: string;
  address?: string;
  state?: string;
  status: EnquiryStatus;
  /** Only an admin can set this; staff see just the leads assigned to them. */
  assignedTo?: UserRef | string | null;
  /** Staff member who added it from the admin panel; absent for public form submissions. */
  createdBy?: UserRef | string | null;
  /** The one pending follow-up, if any. */
  nextFollowUpAt?: string;
  notes: EnquiryNote[];
  /** Only on the single-lead response, not in lists. */
  activities?: EnquiryActivity[];
  createdAt: string;
  updatedAt?: string;
}

export interface EnquiryStats {
  total: number;
  byStatus: Record<EnquiryStatus, number>;
  bySource: Record<EnquirySource, number>;
  followUps?: { overdue: number; today: number; upcoming: number };
}
