"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageSquareDashed, UserRound, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationPreview } from "@/types/messaging";
import { ConversationAvatar } from "@/features/messages/components/MessagesPrimitives";
import { cn } from "@/lib/utils";

function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
}: {
  conversation: ConversationPreview;
  isSelected: boolean;
  onSelect: (conversationId: number) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all",
        isSelected
          ? "border-primary/35 bg-primary/8 shadow-sm"
          : "border-border/60 bg-background/70 hover:border-primary/20 hover:bg-muted/40"
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <ConversationAvatar conversation={conversation} size="lg" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 break-words font-medium">{conversation.title}</p>
            {conversation.subtitle ? (
              <p className="truncate text-sm text-muted-foreground">
                {conversation.subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
            {conversation.unreadCount > 0 ? (
              <Badge variant="secondary">{conversation.unreadCount}</Badge>
            ) : null}
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {conversation.lastMessagePreview || "Aucun message pour l'instant."}
        </p>
      </div>
    </button>
  );
}

export function ConversationSidebar({
  groupedConversations,
  selectedConversationId,
  conversationQuery,
  unreadConversationCount,
  onConversationQueryChange,
  onOpenDirectDialog,
  onSelectConversation,
}: {
  groupedConversations: {
    group: ConversationPreview[];
    direct: ConversationPreview[];
  };
  selectedConversationId: number | null;
  conversationQuery: string;
  unreadConversationCount: number;
  onConversationQueryChange: (value: string) => void;
  onOpenDirectDialog: () => void;
  onSelectConversation: (conversationId: number) => void;
}) {
  const normalizedQuery = conversationQuery.trim().toLowerCase();
  const filteredDirectConversations = !normalizedQuery
    ? groupedConversations.direct
    : groupedConversations.direct.filter((conversation) =>
        `${conversation.title} ${conversation.subtitle ?? ""} ${
          conversation.lastMessagePreview ?? ""
        }`
          .toLowerCase()
          .includes(normalizedQuery)
      );

  const hasConversations =
    groupedConversations.group.length > 0 || groupedConversations.direct.length > 0;

  return (
    <Card className="overflow-hidden border-border/60 py-0 md:flex md:h-full md:flex-col">
      <CardHeader className="border-b border-border/60 px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <CardTitle className="text-lg">Conversations</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {unreadConversationCount} non lu{unreadConversationCount > 1 ? "s" : ""}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
              onClick={onOpenDirectDialog}
            >
              <UserRound data-icon="inline-start" />
              Nouveau DM
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 px-3 py-3">
        {!hasConversations ? (
          <Empty className="min-h-72 rounded-2xl border border-dashed border-border/60 bg-muted/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareDashed />
              </EmptyMedia>
              <EmptyTitle>Aucune conversation.</EmptyTitle>
              <EmptyDescription>
                Rejoins un groupe ou démarre un DM autorisé.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex h-full flex-col gap-4">
            <ScrollArea className="h-[min(64vh,42rem)] pr-1 md:h-full">
              <div className="flex flex-col gap-4 pb-1">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Groupes
                    </p>
                    <Badge variant="outline">{groupedConversations.group.length}</Badge>
                  </div>

                  {groupedConversations.group.length === 0 ? (
                    <Empty className="min-h-40 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Users />
                        </EmptyMedia>
                        <EmptyTitle>Aucun groupe actif.</EmptyTitle>
                        <EmptyDescription>
                          Les conversations de groupe apparaîtront ici.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    groupedConversations.group.map((conversation) => (
                      <ConversationListItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversationId === conversation.id}
                        onSelect={onSelectConversation}
                      />
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Messages privés
                    </p>
                    <Badge variant="outline">{groupedConversations.direct.length}</Badge>
                  </div>

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="dm-search">Rechercher un message privé</FieldLabel>
                      <Input
                        id="dm-search"
                        value={conversationQuery}
                        onChange={(event) => onConversationQueryChange(event.target.value)}
                        placeholder="Nom, email ou dernier message"
                      />
                    </Field>
                  </FieldGroup>

                  {groupedConversations.direct.length === 0 ? (
                    <Empty className="min-h-40 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <UserRound />
                        </EmptyMedia>
                        <EmptyTitle>Aucun DM ouvert.</EmptyTitle>
                        <EmptyDescription>
                          Démarre un échange privé depuis l&apos;action en haut de page.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : filteredDirectConversations.length === 0 ? (
                    <Empty className="min-h-40 rounded-2xl border border-dashed border-border/60 bg-muted/10">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <MessageSquareDashed />
                        </EmptyMedia>
                        <EmptyTitle>Aucun résultat.</EmptyTitle>
                        <EmptyDescription>
                          Ajuste la recherche pour retrouver un DM existant.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    filteredDirectConversations.map((conversation) => (
                      <ConversationListItem
                        key={conversation.id}
                        conversation={conversation}
                        isSelected={selectedConversationId === conversation.id}
                        onSelect={onSelectConversation}
                      />
                    ))
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
