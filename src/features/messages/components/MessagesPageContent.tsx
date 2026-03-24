"use client";

import { DeleteMessageDialog } from "@/features/messages/components/DeleteMessageDialog";
import { ConversationPanel } from "@/features/messages/components/ConversationPanel";
import { ConversationSidebar } from "@/features/messages/components/ConversationSidebar";
import { DirectMessageDialog } from "@/features/messages/components/DirectMessageDialog";
import { MessagesPageSkeleton } from "@/features/messages/components/MessagesPageSkeleton";
import { useMessagesPageState } from "@/features/messages/hooks/useMessagesPageState";

export function MessagesPageContent() {
  const page = useMessagesPageState();

  if (page.isLoading || page.hasMessagingAccess === false) {
    return <MessagesPageSkeleton />;
  }

  return (
    <>
      <div className="-mx-4 -my-4 flex h-[calc(100svh-3.5rem)] w-[calc(100%+2rem)] flex-col gap-4 overflow-hidden px-0 animate-in fade-in duration-500 md:mx-auto md:my-0 md:h-[calc(100svh-3.5rem-2rem)] md:min-h-0 md:w-full md:max-w-[1440px] md:overflow-hidden md:px-4 lg:h-[calc(100svh-4rem-4rem)] lg:max-w-none lg:gap-0 lg:px-0">
        <div className="min-h-0 flex-1 md:hidden">
          {page.isMobileConversationOpen && page.selectedPreview ? (
            <ConversationPanel
              selectedPreview={page.selectedPreview}
              selectedConversation={page.selectedConversation}
              error={page.error}
              isConversationLoading={page.isConversationLoading}
              isClosingDirectConversation={page.isClosingDirectConversation}
              trackedJobIds={page.trackedJobIds}
              draft={page.draft}
              isSending={page.isSending}
              isMobile
              onBack={() => page.setIsMobileConversationOpen(false)}
              onCloseDirectConversation={() => {
                void page.closeSelectedDirectConversation();
              }}
              onTrackJob={(job) => {
                void page.addSharedJobToApplications(job);
              }}
              onDeleteMessage={page.setMessagePendingDeletion}
              onDraftChange={page.setDraft}
              onSend={() => {
                void page.sendCurrentMessage();
              }}
              threadBottomRef={page.mobileThreadBottomRef}
              threadScrollAreaRef={page.mobileThreadScrollAreaRef}
            />
          ) : (
            <ConversationSidebar
              isMobile
              groupedConversations={page.groupedConversations}
              selectedConversationId={page.selectedConversationId}
              conversationQuery={page.conversationQuery}
              unreadConversationCount={page.unreadConversationCount}
              onConversationQueryChange={page.setConversationQuery}
              onOpenDirectDialog={() => page.setIsDirectDialogOpen(true)}
              onSelectConversation={page.openConversation}
            />
          )}
        </div>

        <div className="hidden min-h-0 min-w-0 gap-4 md:grid md:h-full md:grid-cols-[360px_minmax(0,1fr)]">
          <ConversationSidebar
            groupedConversations={page.groupedConversations}
            selectedConversationId={page.selectedConversationId}
            conversationQuery={page.conversationQuery}
            unreadConversationCount={page.unreadConversationCount}
            onConversationQueryChange={page.setConversationQuery}
            onOpenDirectDialog={() => page.setIsDirectDialogOpen(true)}
            onSelectConversation={page.openConversation}
          />

          <ConversationPanel
            selectedPreview={page.selectedPreview}
            selectedConversation={page.selectedConversation}
            error={page.error}
            isConversationLoading={page.isConversationLoading}
            isClosingDirectConversation={page.isClosingDirectConversation}
            trackedJobIds={page.trackedJobIds}
            draft={page.draft}
            isSending={page.isSending}
            onCloseDirectConversation={() => {
              void page.closeSelectedDirectConversation();
            }}
            onTrackJob={(job) => {
              void page.addSharedJobToApplications(job);
            }}
            onDeleteMessage={page.setMessagePendingDeletion}
            onDraftChange={page.setDraft}
            onSend={() => {
              void page.sendCurrentMessage();
            }}
            threadBottomRef={page.desktopThreadBottomRef}
            threadScrollAreaRef={page.desktopThreadScrollAreaRef}
          />
        </div>
      </div>

      <DirectMessageDialog
        open={page.isDirectDialogOpen}
        contacts={page.contacts}
        contactQuery={page.contactQuery}
        contactsError={page.contactsError}
        filteredContacts={page.filteredContacts}
        isContactsLoading={page.isContactsLoading}
        onContactQueryChange={page.setContactQuery}
        onOpenChange={page.setIsDirectDialogOpen}
        onSelectContact={page.createDirectConversation}
      />

      <DeleteMessageDialog
        open={Boolean(page.messagePendingDeletion)}
        isDeleting={page.isDeletingMessage}
        onConfirm={() => {
          void page.deleteSelectedMessage();
        }}
        onOpenChange={(open) => {
          if (!open && !page.isDeletingMessage) {
            page.setMessagePendingDeletion(null);
          }
        }}
      />
    </>
  );
}
