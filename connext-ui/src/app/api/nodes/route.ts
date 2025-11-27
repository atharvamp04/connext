import { NextResponse } from "next/server";

export async function GET() {
  // TODO: replace this with real `docker exec headscale headscale nodes list --output json`
  const mock = [
    {
      id: 1,
      hostname: "desktop-1v6t2gj",
      name: "desktop-1v6t2gj",
      user: "myuser",
      ipv4: "100.64.0.1",
      ipv6: "fd7a:115c:a1e0::1",
      lastSeen: "just now",
      connected: true,
    },
  ];

  return NextResponse.json(mock);
}
