import { NextResponse } from "next/server";
import { listActiveFeaturedSearches } from "@/lib/server/featuredSearches";

export async function GET() {
  try {
    const featuredSearches = await listActiveFeaturedSearches();
    return NextResponse.json({ featuredSearches });
  } catch {
    return NextResponse.json(
      { error: "Chargement des recherches mises en avant impossible." },
      { status: 500 }
    );
  }
}
