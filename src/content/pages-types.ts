import type { FaqItem } from '@/components/faq'

/**
 * Shared shape for a long-tail page, across both brands. The content itself is
 * brand-specific (see watermarkremoverpro/pages.ts and neverprompted/pages.ts);
 * this file only fixes the contract the route files and long-tail-page.tsx
 * render against, so a change here is a change both brands must satisfy.
 */

export interface Section {
  heading: string
  body: string[]
}

export interface LongTailPage {
  slug: string
  group: 'for' | 'vs' | 'guide' | 'in'
  title: string
  metaTitle: string
  metaDescription: string
  intro: string
  sections: Section[]
  faq: FaqItem[]
}
