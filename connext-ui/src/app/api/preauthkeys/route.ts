import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST() {
  // TODO: replace with:
  // docker exec headscale headscale preauthkeys create --user 1 --reusable --expiration 24h
  const key = crypto.randomBytes(24).toString("hex");
  return NextResponse.json({ key });
}
