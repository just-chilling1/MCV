# Supabase migrations for Mobile Cash Vault

This app uses the existing app3 Supabase project. Do not re-run migrations that are already applied there.

## Already on the shared project (do not re-run)

- `001_create_articles_table.sql`
- `002_powerup_grants.sql`
- `003_snippets_cta_library.sql`
- `004_default_all_powerups.sql`
- `005_protector_powerup.sql`
- `005_user_onboarding.sql`
- `006_specialist_popup_events.sql`
- `20261019120000_control_plane_catalog.sql` (identical to the BlackBox catalog migration)

Also skip, because the shared project already has the same objects:

- `20260506000000_user_onboarding.sql` (adds `users.onboarding_completed_at`)
- `20260805000000_specialist_popup_events.sql` (table already exists; app3 uses an RPC instead of an anon insert policy)
- `20260617000000_skeleton_core.sql` (indexes `search_history` and related tables that this product does not create)

## Run these, in order, if the tables are not already present

1. `20260701000000_premium_features.sql` — `user_premium_settings`, `user_autopilot_completions`
2. `20260701010000_training_completions.sql`
3. `20260702000000_blog_builder_kickoff.sql` — `blog_builder_sessions`, `link_vault`
4. `20260703000000_sites_theme_config.sql`
5. `20260704000000_blog_builder_sites_posts.sql` — `sites`, `posts`, `affiliate_clicks`
6. `20260726120000_product_sales_pages.sql`
7. `20260727100000_thread_generation_log.sql`
8. `20260727120000_thread_generation_log_insert_policy.sql`
9. `20260727130000_site_x_threads.sql`
10. `20260727140000_generated_content_persistence.sql` — `site_x_tags`
11. `20260727150000_premium_templates.sql` — `site_facebook_posts`, `premium_article_templates`
12. `20260727160000_site_x_threads_image_url.sql`
13. `20260729120000_site_recurring_articles.sql`
14. `20260803000000_site_x_threads_labels.sql`
15. `20260803010000_user_handles_clean_slugs.sql` — `user_handles`
16. `20260818120000_site_recurring_articles_optional_template.sql`
17. `20261027120000_security_hardening.sql` — live_sites/live_posts views, users RLS, click/storage/specialist policies, articles.images

## Storage

Confirm the `article-images` bucket exists (used by `/api/generate-image`). Create it as a public or signed bucket if article images 404 after upload.

Nothing in this folder is applied automatically. Run the new files yourself in the Supabase SQL editor or with `supabase db push` against the shared project.
