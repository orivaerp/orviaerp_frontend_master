export type ContactService =
  | 'custom-erp'
  | 'school-college-erp'
  | 'hospital-management'
  | 'inventory-gst-billing'
  | 'crm-lead-management'
  | 'website-design-development'
  | 'ecommerce-development'
  | 'mobile-app-development'
  | 'web-application-development'
  | 'ui-ux-design'
  | 'seo-services'
  | 'local-seo-google-business'
  | 'google-ads-ppc'
  | 'social-media-marketing'
  | 'not-sure';

export interface ContactServiceOption {
  value: ContactService;
  label: string;
}

// Exact copy from the public "Project brief" form's service dropdown.
export const CONTACT_SERVICE_OPTIONS: ContactServiceOption[] = [
  { value: 'custom-erp', label: 'Custom ERP Software Development' },
  { value: 'school-college-erp', label: 'School & College ERP' },
  { value: 'hospital-management', label: 'Hospital Management Software' },
  { value: 'inventory-gst-billing', label: 'Inventory & GST Billing Software' },
  { value: 'crm-lead-management', label: 'CRM & Lead Management' },
  { value: 'website-design-development', label: 'Website Design & Development' },
  { value: 'ecommerce-development', label: 'E-Commerce Development' },
  { value: 'mobile-app-development', label: 'Android & iOS Mobile App Development' },
  { value: 'web-application-development', label: 'Web Application Development' },
  { value: 'ui-ux-design', label: 'UI / UX Design' },
  { value: 'seo-services', label: 'SEO Services' },
  { value: 'local-seo-google-business', label: 'Local SEO & Google Business' },
  { value: 'google-ads-ppc', label: 'Google Ads & PPC' },
  { value: 'social-media-marketing', label: 'Social Media Marketing' },
  { value: 'not-sure', label: 'Not sure / something else' },
];

export type ContactBudget = 'under-25k' | '25k-75k' | '75k-2l' | '2l-5l' | 'above-5l' | 'not-sure';

export const CONTACT_BUDGET_OPTIONS: { value: ContactBudget; label: string }[] = [
  { value: 'under-25k', label: 'Under ₹25,000' },
  { value: '25k-75k', label: '₹25,000 – ₹75,000' },
  { value: '75k-2l', label: '₹75,000 – ₹2,00,000' },
  { value: '2l-5l', label: '₹2,00,000 – ₹5,00,000' },
  { value: 'above-5l', label: 'Above ₹5,00,000' },
  { value: 'not-sure', label: 'Not sure yet' },
];

export type ContactTimeline = 'asap' | 'within-1-month' | '1-3-months' | 'just-researching';

export const CONTACT_TIMELINE_OPTIONS: { value: ContactTimeline; label: string }[] = [
  { value: 'asap', label: 'As soon as possible' },
  { value: 'within-1-month', label: 'Within 1 month' },
  { value: '1-3-months', label: '1 – 3 months' },
  { value: 'just-researching', label: 'Just researching' },
];

export type ContactStatus = 'new' | 'contacted' | 'in-progress' | 'converted' | 'lost' | 'closed';

export const CONTACT_STATUSES: ContactStatus[] = ['new', 'contacted', 'in-progress', 'converted', 'lost', 'closed'];

const SERVICE_LABELS = Object.fromEntries(CONTACT_SERVICE_OPTIONS.map((o) => [o.value, o.label])) as Record<
  ContactService,
  string
>;
const BUDGET_LABELS = Object.fromEntries(CONTACT_BUDGET_OPTIONS.map((o) => [o.value, o.label])) as Record<
  ContactBudget,
  string
>;
const TIMELINE_LABELS = Object.fromEntries(CONTACT_TIMELINE_OPTIONS.map((o) => [o.value, o.label])) as Record<
  ContactTimeline,
  string
>;

export function serviceLabel(value: ContactService): string {
  return SERVICE_LABELS[value] ?? value;
}
export function budgetLabel(value: ContactBudget): string {
  return BUDGET_LABELS[value] ?? value;
}
export function timelineLabel(value: ContactTimeline): string {
  return TIMELINE_LABELS[value] ?? value;
}

export interface ContactNote {
  text: string;
  addedBy?: { _id: string; firstName: string; lastName?: string } | string;
  createdAt: string;
}

export interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  companyWebsite?: string;
  service: ContactService;
  budget?: ContactBudget;
  timeline?: ContactTimeline;
  message: string;
  status: ContactStatus;
  assignedTo?: { _id: string; firstName: string; lastName?: string } | string | null;
  notes: ContactNote[];
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactStats {
  total: number;
  byStatus: Record<ContactStatus, number>;
  byService: Record<ContactService, number>;
}
