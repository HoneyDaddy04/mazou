import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateApiKey } from "@/lib/utils";

const MOCK_KEYS = [
  { id: "key-1", name: "Production Key", keyPrefix: "mz_live_a8f2...", lastUsedAt: "2026-03-04T14:22:00Z", totalCalls: 12847, status: "active", createdAt: "2026-02-01T10:00:00Z" },
  { id: "key-2", name: "Staging Key", keyPrefix: "mz_live_b3c9...", lastUsedAt: "2026-03-03T09:15:00Z", totalCalls: 3421, status: "active", createdAt: "2026-02-10T08:30:00Z" },
  { id: "key-3", name: "Old Test Key", keyPrefix: "mz_test_d1e7...", lastUsedAt: "2026-02-15T11:00:00Z", totalCalls: 892, status: "revoked", createdAt: "2026-01-15T12:00:00Z" },
];

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ keys: MOCK_KEYS });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  const fullKey = generateApiKey("mz_live");
  const keyPrefix = fullKey.slice(0, 12) + "...";

  const key = {
    id: `key-${Date.now()}`,
    name: name || "New API Key",
    keyPrefix,
    keyHash: "demo",
    lastUsedAt: null,
    totalCalls: 0,
    status: "active",
    createdAt: new Date().toISOString(),
    createdBy: session.user.id,
    orgId: session.user.orgId,
  };

  return NextResponse.json({ key: { ...key, full_key: fullKey } }, { status: 201 });
}
