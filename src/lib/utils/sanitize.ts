// src/lib/utils/sanitize.ts
// Sanitizes admin-authored HTML before it's rendered to public visitors via
// dangerouslySetInnerHTML. Even though only editor+ roles can currently
// write custom_html/custom_rich_text content, treating that boundary as
// permanent over a 10-year platform lifetime is fragile — a compromised
// editor account, a future lower-privilege content path, or a copy-paste
// from an untrusted source should not become a stored-XSS vector against
// every site visitor. Sanitize unconditionally at render time.

import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
  'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'span', 'div', 'hr',
]

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height']

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Strip event handlers, javascript: URLs, <script>, <style>, inline event attrs
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
  })
}
