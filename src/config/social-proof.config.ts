export const socialProof = {
  enabled: false,
  loginPage: {
    activeMembers: 0,
    earnedThisMonth: "",
    rating: "",
  },
  ticker: {
    onlineCount: 0,
    messages: [] as string[],
  },
  toast: {
    messages: [] as { name: string; action: string; amount: string }[],
    intervalMinMs: 15000,
    intervalMaxMs: 25000,
  },
} as const;
