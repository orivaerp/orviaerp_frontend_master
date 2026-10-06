import { ENQUIRY_CATEGORIES, ENQUIRY_SOURCES, ENQUIRY_STATUSES } from '../../core/models/enquiry.model';

/** Same columns the backend export produces and the import reads (header case is ignored). */
export const LEAD_IMPORT_HEADERS = [
  'Name',
  'Email',
  'Phone',
  'Subject',
  'Message',
  'Source',
  'Status',
  'Category',
  'Sub Category',
  'Firm Name',
  'Website',
  'City',
  'Address',
  'State',
] as const;

const SAMPLE_ROWS: string[][] = [
  [
    'Rahul Sharma',
    'rahul@example.com',
    '919876543210',
    'Clinic software enquiry',
    'Wants a demo of the ERP for his clinic',
    'walkin',
    'new',
    'health',
    'Clinic',
    'Sharma Clinic',
    'https://sharmaclinic.example.com',
    'Lucknow',
    '12, Hazratganj',
    'Uttar Pradesh',
  ],
  [
    'Priya Verma',
    '',
    '919123456789',
    'School fee module',
    'Called after seeing the campaign',
    'campaign',
    'contacted',
    'education',
    'School',
    'Verma Public School',
    '',
    'Pune',
    'Baner Road',
    'Maharashtra',
  ],
  ['Amit Singh', '', '918800112233', '', '', 'website', 'new', '', '', '', '', 'Jaipur', '', 'Rajasthan'],
];

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Plain UTF-8 with no BOM — the backend parser would otherwise read it into the first header. */
export function buildLeadImportSampleCsv(): string {
  return [LEAD_IMPORT_HEADERS as readonly string[], ...SAMPLE_ROWS]
    .map((row) => row.map(csvCell).join(','))
    .join('\n');
}

export const LEAD_IMPORT_ALLOWED_VALUES = {
  source: ENQUIRY_SOURCES,
  status: ENQUIRY_STATUSES,
  category: ENQUIRY_CATEGORIES,
};
