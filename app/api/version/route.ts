import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const version = "2026.09.02.1";
  const response = NextResponse.json({
    version,
    timestamp: Date.now(),
  });

  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}
