import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function tokensMatch(received: string, expected: string): boolean {
  const actual = Buffer.from(received);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length) return false;
  return timingSafeEqual(actual, wanted);
}

export function controlPlaneAuthError(request: Request): NextResponse | null {
  const expected = process.env.CONTROL_PLANE_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "CONTROL_PLANE_SECRET is not set on this app." },
      { status: 503 }
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || !tokensMatch(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
