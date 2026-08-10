import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ordra-web",
    timestamp: new Date().toISOString(),
  });
}
