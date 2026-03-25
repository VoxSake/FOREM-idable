import { getCurrentUser } from "@/lib/server/auth";
import { logMessagingDebug } from "@/lib/server/messagingDebug";
import { subscribeMessageEvents } from "@/lib/server/messageEvents";
import { MessageStreamEvent } from "@/types/messaging";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function encodeSseMessage(event: MessageStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Forbidden", { status: 403 });
  }

  logMessagingDebug("stream-open", {
    userId: user.id,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        clearInterval(heartbeatId);
        unsubscribe();
        logMessagingDebug("stream-close", {
          userId: user.id,
        });
        controller.close();
      };

      const send = (event: MessageStreamEvent) => {
        if (closed) {
          return;
        }

        logMessagingDebug("stream-send", {
          userId: user.id,
          type: event.type,
          conversationId: "conversationId" in event ? event.conversationId : undefined,
          messageId: "messageId" in event ? event.messageId : undefined,
        });

        controller.enqueue(encoder.encode(encodeSseMessage(event)));
      };

      const unsubscribe = subscribeMessageEvents(user.id, send);
      const heartbeatId = setInterval(() => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 25000);

      controller.enqueue(
        encoder.encode(
          encodeSseMessage({
            type: "stream.connected",
            connectedAt: new Date().toISOString(),
          })
        )
      );

      request.signal.addEventListener("abort", close);
    },
    cancel() {
      // Browser-initiated close is already handled via request abort.
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
