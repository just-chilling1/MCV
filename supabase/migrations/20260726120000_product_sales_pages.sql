-- Product promotion sites: store generated sales page HTML on sites

alter table public.sites
  add column if not exists site_type text not null default 'product'
    check (site_type in ('product', 'blog'));

alter table public.sites
  add column if not exists sales_page_html text;

alter table public.sites
  add column if not exists sales_page_json jsonb;

create index if not exists sites_site_type_idx on public.sites(site_type);
