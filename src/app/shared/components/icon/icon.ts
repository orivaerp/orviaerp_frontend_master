import { Component, Input } from '@angular/core';

/**
 * Minimal inline-SVG icon set (stroke-based, 24x24) selected by `name`.
 * Keeps feature templates free of inline path data.
 */
@Component({
  selector: 'app-icon',
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.width]="size"
      [attr.height]="size"
    >
      @switch (name) {
        @case ('globe') {
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        }
        @case ('mail') {
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        }
        @case ('grid') {
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        }
        @case ('cpu') {
          <rect x="6" y="6" width="12" height="12" rx="2" />
          <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
        }
        @case ('megaphone') {
          <path d="M3 11v2a2 2 0 0 0 2 2h1l3 5V4l-3 5H5a2 2 0 0 0-2 2Z" />
          <path d="M15 8a4 4 0 0 1 0 8M18 5a8 8 0 0 1 0 14" />
        }
        @case ('bag') {
          <path d="M6 7h12l1 13H5L6 7Z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        }
        @case ('home') {
          <path d="m3 11 9-7 9 7" />
          <path d="M5 10v10h14V10" />
        }
        @case ('server') {
          <rect x="3" y="4" width="18" height="6" rx="1.5" />
          <rect x="3" y="14" width="18" height="6" rx="1.5" />
          <path d="M7 7h.01M7 17h.01" />
        }
        @case ('gauge') {
          <path d="M12 21a9 9 0 1 1 9-9" />
          <path d="M12 12 16 8" />
        }
        @case ('chart') {
          <path d="M4 20V10M12 20V4M20 20v-7" />
        }
        @case ('shield') {
          <path d="M12 3 5 6v5c0 5 3 7.5 7 10 4-2.5 7-5 7-10V6l-7-3Z" />
        }
        @case ('window') {
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18" />
        }
        @case ('folder') {
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        }
        @case ('database') {
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
          <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9c.2.5.7 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
          />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        }
        @case ('bot') {
          <rect x="4" y="9" width="16" height="10" rx="2" />
          <path d="M12 5v4M9 14v1M15 14v1" />
          <circle cx="12" cy="4" r="1" />
        }
        @case ('logout') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5M21 12H9" />
        }
        @case ('chevron-down') {
          <path d="m6 9 6 6 6-6" />
        }
        @case ('check') {
          <path d="M20 6 9 17l-5-5" />
        }
        @case ('external') {
          <path d="M14 3h7v7M21 3l-9 9M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
        }
        @case ('blog') {
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          <path d="M9 7h7M9 11h7" />
        }
        @case ('trending') {
          <path d="M3 17 9 11l4 4 8-8" />
          <path d="M15 7h6v6" />
        }
        @case ('tag') {
          <path d="M14 3h5a2 2 0 0 1 2 2v5L11 20 4 13 14 3Z" />
          <circle cx="15.5" cy="8.5" r="1.2" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c.6-3.6 3.3-6 6.5-6s5.9 2.4 6.5 6" />
          <path d="M16.5 5.3a3.5 3.5 0 0 1 0 6.9M21.5 20c-.4-2.5-1.8-4.5-3.8-5.5" />
        }
        @case ('layers') {
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 13 9 5 9-5" />
        }
        @case ('inbox') {
          <path d="M3 12h5l2 3h4l2-3h5" />
          <path d="M5.5 5h13L21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6L5.5 5Z" />
        }
      }
    </svg>
  `,
})
export class Icon {
  @Input() name = '';
  @Input() size = 18;
}
