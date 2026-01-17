/**
 * CSS Sanitizer - Prevents CSS injection attacks
 * 
 * Blocks dangerous CSS patterns:
 * - url() - can exfiltrate data via background images
 * - @import - can load external stylesheets
 * - @font-face - can load external fonts
 * - expression() - IE-specific JavaScript execution
 * - javascript: - inline JavaScript
 * - behavior: - IE-specific scripting
 * - -moz-binding - Firefox-specific XBL injection
 * - position: fixed/sticky - can create clickjacking overlays outside container
 */

// Dangerous patterns to remove from CSS
const DANGEROUS_PATTERNS = [
  // Data exfiltration via URLs
  /url\s*\([^)]*\)/gi,
  // External stylesheet imports
  /@import\s+[^;]+;?/gi,
  // External font loading
  /@font-face\s*\{[^}]*\}/gi,
  // IE expression (JavaScript execution)
  /expression\s*\([^)]*\)/gi,
  // JavaScript protocol
  /javascript\s*:/gi,
  // IE behavior property
  /behavior\s*:\s*[^;]+;?/gi,
  // Firefox XBL binding
  /-moz-binding\s*:\s*[^;]+;?/gi,
  // Data URIs (can embed malicious content)
  /data\s*:/gi,
  // VBScript (IE)
  /vbscript\s*:/gi,
  // Charset manipulation
  /@charset\s+[^;]+;?/gi,
];

// Properties that could be used for overlay attacks (position outside scoped container)
const POSITION_FIXED_PATTERN = /position\s*:\s*(fixed|sticky)\s*[;!]/gi;

// Remove !important to prevent style override attacks
const IMPORTANT_PATTERN = /!important/gi;

/**
 * Sanitizes CSS to prevent injection attacks
 * @param css - The raw CSS input
 * @param options - Sanitization options
 * @returns Sanitized CSS string
 */
export function sanitizeCss(
  css: string,
  options: {
    allowUrls?: boolean;
    allowImportant?: boolean;
    allowFixedPosition?: boolean;
    blockId?: string;
  } = {}
): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  let sanitized = css;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    // Skip URL pattern if allowed (not recommended for user content)
    if (pattern === DANGEROUS_PATTERNS[0] && options.allowUrls) {
      continue;
    }
    sanitized = sanitized.replace(pattern, '/* blocked */');
  }

  // Block position: fixed/sticky unless explicitly allowed
  if (!options.allowFixedPosition) {
    sanitized = sanitized.replace(POSITION_FIXED_PATTERN, 'position: relative;');
  }

  // Remove !important unless explicitly allowed
  if (!options.allowImportant) {
    sanitized = sanitized.replace(IMPORTANT_PATTERN, '');
  }

  // Additional cleanup: remove any remaining @ rules that might be dangerous
  sanitized = sanitized.replace(/@keyframes\s+\S+\s*\{[\s\S]*?\}\s*\}/gi, (match) => {
    // Allow keyframes but sanitize their content
    return match.replace(DANGEROUS_PATTERNS[0], '/* blocked */');
  });

  // Trim and clean up multiple spaces/newlines
  sanitized = sanitized.replace(/\/\*\s*blocked\s*\*\/\s*/g, '').trim();

  return sanitized;
}

/**
 * Scopes CSS selectors to a specific container ID
 * @param css - The CSS to scope
 * @param containerId - The container ID to scope to
 * @returns Scoped CSS string
 */
export function scopeCssToContainer(css: string, containerId: string): string {
  if (!css || !containerId) {
    return '';
  }

  // First sanitize, then scope
  const sanitized = sanitizeCss(css);
  
  // Scope selectors to the container
  // This regex matches CSS selectors before { and prepends the container ID
  return sanitized.replace(/([^{}@]+)(\{)/g, (match, selector, brace) => {
    // Don't scope @keyframes or @media rule names
    if (selector.trim().startsWith('@')) {
      return match;
    }
    // Scope the selector
    const scopedSelector = selector
      .split(',')
      .map((s: string) => `#${containerId} ${s.trim()}`)
      .join(', ');
    return `${scopedSelector}${brace}`;
  });
}

/**
 * Full CSS sanitization and scoping for custom HTML blocks
 * @param css - Raw CSS input
 * @param blockId - Block ID for scoping
 * @returns Sanitized and scoped CSS
 */
export function sanitizeAndScopeCss(css: string, blockId: string): string {
  const sanitized = sanitizeCss(css);
  return scopeCssToContainer(sanitized, blockId);
}
