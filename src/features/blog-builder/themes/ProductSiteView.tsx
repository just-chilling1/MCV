import { parseSalesPageDocument } from "../lib/product-sales-page-html";
import { sanitizePostHtml } from "../lib/sanitize-html";
import { QuestionnaireSiteEmbed } from "./QuestionnaireSiteEmbed";

interface ProductSiteViewProps {
  html: string;
}

/** Fixes contrast on pages generated before styles were scoped to .product-sales-page-root */
const LEGACY_CONTRAST_FIXES = `
.product-sales-page-root {
  color: var(--text);
  background: var(--bg);
  min-height: 100vh;
}
.product-sales-page-root section {
  background: var(--bg);
  color: var(--text);
}
.product-sales-page-root section.alt {
  background: var(--surface);
}
.product-sales-page-root .title,
.product-sales-page-root h2 {
  color: var(--text) !important;
}
.product-sales-page-root .label {
  color: var(--label, color-mix(in srgb, var(--accent) 35%, white)) !important;
}
.product-sales-page-root .content-item,
.product-sales-page-root .card,
.product-sales-page-root .list li,
.product-sales-page-root .faq,
.product-sales-page-root .problem-item,
.product-sales-page-root .numbered-item,
.product-sales-page-root .card-bento {
  color: var(--card-text, var(--text));
}
.product-sales-page-root .content-item span:last-child,
.product-sales-page-root .faq-q,
.product-sales-page-root .card h3,
.product-sales-page-root .card-bento h3,
.product-sales-page-root .numbered-item h3,
.product-sales-page-root .luxury-item h3,
.product-sales-page-root .stack-item strong {
  color: var(--card-text, #1c1917) !important;
}
.product-sales-page-root .faq-a,
.product-sales-page-root .card p {
  color: var(--card-muted, var(--muted));
}
.product-sales-page-root .benefits-grid,
.product-sales-page-root .card-grid {
  display: grid !important;
  grid-template-columns: 1fr !important;
  gap: 32px !important;
}
@media (min-width: 640px) {
  .product-sales-page-root .benefits-grid,
  .product-sales-page-root .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}
@media (min-width: 960px) {
  .product-sales-page-root .benefits-grid.benefits-grid-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }
}
`;

/** Renders a generated questionnaire or product page (full HTML document stored on the site). */
export function ProductSiteView({ html }: ProductSiteViewProps) {
  const { styles, bodyHtml, googleFontsUrl } = parseSalesPageDocument(html);
  const safeBody = sanitizePostHtml(bodyHtml);
  const isQuestionnaire = safeBody.includes("questionnaire-root");

  if (isQuestionnaire) {
    return <QuestionnaireSiteEmbed html={html} />;
  }

  return (
    <>
      {googleFontsUrl ? (
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      ) : null}
      {googleFontsUrl ? (
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      ) : null}
      {googleFontsUrl ? <link rel="stylesheet" href={googleFontsUrl} /> : null}
      <div className="product-sales-page-root min-h-screen isolate">
        {styles ? <style dangerouslySetInnerHTML={{ __html: styles }} /> : null}
        <style dangerouslySetInnerHTML={{ __html: LEGACY_CONTRAST_FIXES }} />
        <div dangerouslySetInnerHTML={{ __html: safeBody }} />
      </div>
    </>
  );
}
