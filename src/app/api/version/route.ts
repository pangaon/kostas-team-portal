import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const id = process.env.VERCEL_GIT_COMMIT_SHA || "dev";
  return new NextResponse(JSON.stringify({ id }), {
    headers: { "content-type": "application/json", "cache-control": "no-store, max-age=0" },
  });
}
