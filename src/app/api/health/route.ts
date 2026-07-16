import { NextResponse } from "next/server";
import { env } from "@/core/env";

export async function GET() {
  return NextResponse.json({
    ok: Boolean(env.DATABASE_URL),
    service: "vulcan",
    status: env.DATABASE_URL ? "ready" : "configuration-required",
  }, { status: env.DATABASE_URL ? 200 : 503 });
}
