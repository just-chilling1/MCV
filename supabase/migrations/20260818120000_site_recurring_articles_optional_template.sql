-- Allow offer-library authority articles that are generated in-app
-- (Done-For-You Profit) rather than cloned from premium_article_templates.

alter table public.site_recurring_articles
  alter column template_id drop not null;
