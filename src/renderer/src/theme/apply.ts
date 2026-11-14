import { themeCss } from "./css";
import { tokens } from "./tokens";

/**
 * Sets the theme variables as a constructed stylesheet. CSSOM changes are allowed by the
 * strict CSP (`style-src 'self'`), unlike a `<style>` element or a `style` attribute.
 */
export function applyTheme(doc: Document): void {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(themeCss(tokens));
  doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
}
