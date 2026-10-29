import { describe, expect, it, vi } from "vitest";
import {
  assertPublicHttpsUrl,
  assertPublicHttpUrl,
  fetchPublicHttp,
  isPrivateOrLocalHost,
} from "@/lib/safe-url";

describe("isPrivateOrLocalHost", () => {
  it("blocks IPv4-mapped IPv6 private addresses", () => {
    expect(isPrivateOrLocalHost("::ffff:169.254.169.254")).toBe(true);
    expect(isPrivateOrLocalHost("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateOrLocalHost("::ffff:10.0.0.1")).toBe(true);
  });

  it("allows public IPv4-mapped addresses", () => {
    expect(isPrivateOrLocalHost("::ffff:8.8.8.8")).toBe(false);
  });
});

describe("assertPublicHttpsUrl", () => {
  it("rejects mapped link-local hosts", () => {
    expect(() => assertPublicHttpsUrl("https://[::ffff:169.254.169.254]/")).toThrow(
      /private|local/i
    );
  });
});

describe("fetchPublicHttp", () => {
  it("re-checks redirect Location and refuses a private hop", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "http://169.254.169.254/latest/meta-data/" },
        })
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchPublicHttp("https://example.com/start", { allowHttp: true })
    ).rejects.toThrow(/private|local|https/i);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("follows a safe https redirect", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: "https://example.com/final" },
        })
      )
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);

    // Hostnames need DNS; use literal public IPs to stay offline-friendly.
    await expect(
      fetchPublicHttp("https://8.8.8.8/start")
    ).resolves.toMatchObject({ status: 200 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondUrl = fetchMock.mock.calls[1]?.[0];
    expect(String(secondUrl)).toContain("example.com/final");
    vi.unstubAllGlobals();
  });
});

describe("assertPublicHttpUrl", () => {
  it("allows http for image fetches", () => {
    expect(assertPublicHttpUrl("http://example.com/a.png").protocol).toBe("http:");
  });
});
