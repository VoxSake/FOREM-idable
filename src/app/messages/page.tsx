"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MessagesSquare, Users, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationPreview } from "@/types/messaging";

function MessagesPageSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Card className="border-border/60 py-0">
        <CardHeader className="gap-3 border-b border-border/60 px-6 py-5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-6 py-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border/60 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/messages/conversations", { cache: "no-store" });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          conversations?: ConversationPreview[];
        };

        if (!response.ok || !data.conversations) {
          if (!cancelled) {
            setError(data.error || "Chargement des conversations impossible.");
          }
          return;
        }

        if (!cancelled) {
          setConversations(data.conversations);
        }
      } catch {
        if (!cancelled) {
          setError("Chargement des conversations impossible.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <MessagesPageSkeleton />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <Card className="border-border/60 py-0">
        <CardHeader className="gap-4 border-b border-border/60 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
                <MessagesSquare data-icon="inline-start" className="text-primary" />
                Messages
              </CardTitle>
              <CardDescription className="max-w-3xl">
                Conversations de groupe automatiques et messages privés autorisés selon vos groupes.
                Cette V1 pose la base produit, sans encore activer l&apos;envoi ni le temps réel.
              </CardDescription>
            </div>
            <Badge variant="outline">
              {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-5">
          {error ? (
            <Empty className="min-h-56 rounded-xl border border-dashed border-border/60">
              <EmptyHeader>
                <EmptyTitle>Impossible de charger la messagerie.</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : conversations.length === 0 ? (
            <Empty className="min-h-56 rounded-xl border border-dashed border-border/60">
              <EmptyHeader>
                <EmptyTitle>Aucune conversation disponible.</EmptyTitle>
                <EmptyDescription>
                  Les conversations de groupe apparaîtront ici dès qu&apos;un groupe vous concerne.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-4 transition-colors hover:border-primary/30"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="rounded-full border border-border/60 bg-muted/30 p-2">
                      {conversation.type === "group" ? (
                        <Users className="text-primary" />
                      ) : (
                        <UserRound className="text-primary" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{conversation.title}</p>
                        <Badge variant={conversation.type === "group" ? "secondary" : "outline"}>
                          {conversation.type === "group" ? "Groupe" : "Privé"}
                        </Badge>
                        {conversation.unreadCount > 0 ? (
                          <Badge variant="secondary">
                            {conversation.unreadCount} non lu{conversation.unreadCount > 1 ? "s" : ""}
                          </Badge>
                        ) : null}
                      </div>
                      {conversation.subtitle ? (
                        <p className="text-sm text-muted-foreground">{conversation.subtitle}</p>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
