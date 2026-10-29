export const webhooks = {
  signup: process.env.WEBHOOK_SIGNUP_URL ?? "",
} as const;
