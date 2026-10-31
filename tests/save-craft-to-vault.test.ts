import { describe, expect, it, vi, beforeEach } from "vitest";

const insertSingle = vi.fn();
const updateEq = vi.fn();

vi.mock("@/lib/api-auth", () => ({
  getServiceRoleClient: () => ({
    from: () => ({
      insert: () => ({
        select: () => ({
          single: insertSingle,
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: updateEq,
        }),
      }),
    }),
  }),
}));

describe("saveCraftArticleToVault", () => {
  beforeEach(() => {
    insertSingle.mockReset();
    updateEq.mockReset();
  });

  it("returns the inserted article id", async () => {
    insertSingle.mockResolvedValue({
      data: {
        id: "art-1",
        title: "Hello",
        content: "<p>Hi</p>",
        hook: null,
        cta: null,
        niche: "Tech",
        affiliate_link: null,
      },
      error: null,
    });

    const { saveCraftArticleToVault } = await import(
      "@/features/dfy-profit/lib/save-craft-to-vault"
    );
    const saved = await saveCraftArticleToVault({} as never, "user-1", {
      title: "Hello",
      content: "<p>Hi</p>",
      niche: "Tech",
    });

    expect(saved.id).toBe("art-1");
    expect(saved.title).toBe("Hello");
  });

  it("throws when insert fails", async () => {
    insertSingle.mockResolvedValue({
      data: null,
      error: { message: "RLS blocked" },
    });

    const { saveCraftArticleToVault } = await import(
      "@/features/dfy-profit/lib/save-craft-to-vault"
    );
    await expect(
      saveCraftArticleToVault({} as never, "user-1", {
        title: "Hello",
        content: "<p>Hi</p>",
      })
    ).rejects.toThrow(/RLS blocked|Failed to save/);
  });
});
