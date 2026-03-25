import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { logMessagingDebug } from "@/lib/server/messagingDebug";
import { markConversationAsRead, getConversationDetail } from "@/lib/server/messaging";
import { parseIntegerParam } from "@/lib/server/requestSchemas";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = await context.params;
    const conversationId = parseIntegerParam(params.conversationId);
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation invalide." }, { status: 400 });
    }

    const markAsRead = request.nextUrl.searchParams.get("markAsRead") === "1";
    if (markAsRead) {
      await markConversationAsRead(user, conversationId);
    }

    const conversation = await getConversationDetail(user, conversationId);
    logMessagingDebug("conversation-detail", {
      conversationId,
      markAsRead,
      messageCount: conversation.messages.length,
      userId: user.id,
    });
    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Chargement de la conversation impossible." },
      { status: 500 }
    );
  }
}
