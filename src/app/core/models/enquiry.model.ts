export type EnquiryStatus = 'new' | 'contacted' | 'in-progress' | 'converted' | 'lost' | 'wrong' | 'closed';

export const ENQUIRY_STATUSES: EnquiryStatus[] = [
  'new',
  'contacted',
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

export const ENQUIRY_CATEGORIES: EnquiryCategory[] = ['health', 'education', 'transport', 'retail', 'portfolio'];

/** Suggested sub-categories per domain — shown as datalist hints; the field itself is free text. */
export const ENQUIRY_SUBCATEGORY_SUGGESTIONS: Record<EnquiryCategory, string[]> = {
  health: ['Hospital', 'Clinic', 'Pharmacy', 'Diagnostic Center', 'Wellness Center','Physio Clinic','Dental Clinic'],
  education: ['School', 'College', 'Coaching Institute', 'Online Course', 'Training Center'],
  transport: ['Logistics', 'Cab Service', 'Courier', 'Fleet Management', 'Freight'],
  retail: ['Retail Store', 'Supermarket', 'E-commerce', 'Wholesale', 'Showroom'],
  portfolio: ['Personal Portfolio', 'Agency Portfolio', 'Freelancer Portfolio', 'Photography Portfolio'],
};

export interface EnquiryNote {
  text: string;
  addedBy?: { _id: string; firstName: string; lastName?: string } | string;
  createdAt: string;
}

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
  assignedTo?: { _id: string; firstName: string; lastName?: string } | string | null;
  notes: EnquiryNote[];
  createdAt: string;
  updatedAt?: string;
}

export interface EnquiryStats {
  total: number;
  byStatus: Record<EnquiryStatus, number>;
  bySource: Record<EnquirySource, number>;
}
