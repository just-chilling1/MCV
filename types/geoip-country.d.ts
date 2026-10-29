declare module "geoip-country" {
  type GeoIpLookup = {
    country?: string;
  };

  export function lookup(ip: string): GeoIpLookup | null;
}
