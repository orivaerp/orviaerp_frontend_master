export interface WaContact {
  _id: string;
  waId: string;
  name?: string;
}

export type WaConversationStatus = 'open' | 'pending' | 'closed';

export interface WaAgentRef {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
}

export interface WaConversation {
  _id: string;
  contact: WaContact;
  assignedTo: WaAgentRef | null;
  status: WaConversationStatus;
  lastMessageAt: string;
  lastMessagePreview?: string;
  lastInboundAt?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export type WaMessageDirection = 'inbound' | 'outbound';
export type WaMessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'template' | 'unknown';
export type WaMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WaMessage {
  _id: string;
  conversation: string;
  waMessageId?: string;
  direction: WaMessageDirection;
  type: WaMessageType;
  text?: string;
  media?: {
    url?: string;
    key?: string;
    mimeType?: string;
    filename?: string;
  };
  sentBy?: string;
  status: WaMessageStatus;
  timestamp: string;
}

export type WaConversationFilter = 'all' | 'unassigned' | 'mine';

export interface WaTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  text?: string;
  format?: string;
}

export interface WaTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components: WaTemplateComponent[];
}

/** How many {{1}}, {{2}}, ... placeholders the template's BODY component needs. */
export function templateBodyParamCount(template: WaTemplate): number {
  const body = template.components.find((c) => c.type === 'BODY');
  if (!body?.text) return 0;
  const matches = body.text.match(/\{\{\d+\}\}/g);
  return matches ? new Set(matches).size : 0;
}

export function templateBodyText(template: WaTemplate): string {
  return template.components.find((c) => c.type === 'BODY')?.text ?? '';
}

export type WaHeaderMediaType = 'image' | 'video' | 'document';

export interface WaHeaderMedia {
  type: WaHeaderMediaType;
  id?: string;
  link?: string;
}

/** The media type the template's HEADER needs, or null if it has no media header. */
export function templateHeaderMediaType(template: WaTemplate): WaHeaderMediaType | null {
  const format = template.components.find((c) => c.type === 'HEADER')?.format;
  if (format === 'IMAGE') return 'image';
  if (format === 'VIDEO') return 'video';
  if (format === 'DOCUMENT') return 'document';
  return null;
}

export type WaRecipientStatus = 'queued' | 'sent' | 'failed';

export interface WaBroadcastRecipient {
  waId: string;
  status: WaRecipientStatus;
  waMessageId?: string;
  error?: string;
}

export type WaBroadcastStatus = 'processing' | 'completed';

export interface WaBroadcast {
  _id: string;
  templateName: string;
  templateLanguage: string;
  bodyParams: string[];
  headerMedia?: WaHeaderMedia;
  recipients: WaBroadcastRecipient[];
  totalCount: number;
  sentCount: number;
  failedCount: number;
  status: WaBroadcastStatus;
  createdBy: WaAgentRef;
  createdAt: string;
  updatedAt: string;
}

/** Whether the 24h Meta customer-service window is still open for free-form replies. */
export function isWindowOpen(conversation: Pick<WaConversation, 'lastInboundAt'>): boolean {
  if (!conversation.lastInboundAt) return false;
  const elapsed = Date.now() - new Date(conversation.lastInboundAt).getTime();
  return elapsed <= 24 * 60 * 60 * 1000;
}
