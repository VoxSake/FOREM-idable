import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { sendTextMessage } from "@/lib/server/messaging";
import { sendConversationMessageSchema } from "@/lib/server/messagingSchemas";
import { parseIntegerParam } from "@/lib/server/requestSchemas";

export async function POST(
  request: Request,
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

    const body = sendConversationMessageSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Message invalide." }, { status: 400 });
    }

    const message = await sendTextMessage(user, conversationId, body.data.content);
    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Envoi du message impossible." },
      { status: 500 }
    );
  }
}
