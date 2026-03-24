"use client";

import { UserRound, Users } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ConversationParticipantSummary, ConversationPreview } from "@/types/messaging";
import { getDisplayName, getInitials } from "@/features/messages/messages.utils";

export function ConversationAvatar({
  conversation,
  size = "default",
}: {
  conversation: Pick<ConversationPreview, "title" | "type">;
  size?: "sm" | "default" | "lg";
}) {
  return (
    <Avatar size={size} className="border border-border/70 bg-background">
      <AvatarFallback
        className={cn(
          conversation.type === "group"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {conversation.type === "group" ? <Users /> : <UserRound />}
      </AvatarFallback>
    </Avatar>
  );
}

export function ParticipantStack({
  participants,
}: {
  participants: ConversationParticipantSummary[];
}) {
  const visibleParticipants = participants.slice(0, 3);
  const hiddenCount = Math.max(participants.length - visibleParticipants.length, 0);

  if (participants.length === 0) {
    return null;
  }

  return (
    <AvatarGroup>
      {visibleParticipants.map((participant) => {
        const displayName = getDisplayName({
          firstName: participant.firstName,
          lastName: participant.lastName,
          email: participant.email,
          fallback: "Participant",
        });

        return (
          <Avatar
            key={participant.userId}
            size="sm"
            className="border border-border/70 bg-background"
          >
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        );
      })}
      {hiddenCount > 0 ? <AvatarGroupCount>+{hiddenCount}</AvatarGroupCount> : null}
    </AvatarGroup>
  );
}
