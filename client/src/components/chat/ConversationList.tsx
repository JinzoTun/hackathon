import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Conversation } from '@/api/chatService';
import { useSocket } from '@/api/SocketContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  onSelect: (conversationId: string) => void;
  selectedConversationId: string | null;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUserId,
  onSelect,
  selectedConversationId,
}) => {
  const { onlineUsers } = useSocket();
  const isMobile = useIsMobile();

  // Sort conversations by update time (most recent first)
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  if (sortedConversations.length === 0) {
    return (
      <div className='text-center py-4 text-muted-foreground'>
        <p>No conversations yet</p>
        <p className='text-sm'>Select a user below to start chatting</p>
      </div>
    );
  }

  return (
    <div className='space-y-1 md:space-y-2'>
      {sortedConversations.map((conversation) => {
        // Find the other user in the conversation
        const otherUser = conversation.participants.find(
          (user) => user._id !== currentUserId
        );

        if (!otherUser) return null;

        // Check if user is online
        const isOnline = onlineUsers.has(otherUser._id);

        // Get unread count for this conversation
        const unreadCount = conversation.unreadCount?.[currentUserId] || 0;

        // Format the time
        const updatedTime = formatDistanceToNow(
          new Date(conversation.updatedAt),
          { addSuffix: true }
        );

        return (
          <div
            key={conversation._id}
            className={`p-2 md:p-3  rounded-lg cursor-pointer transition-colors flex items-center gap-2 md:gap-3 ${
              selectedConversationId === conversation._id
                ? 'bg-accent'
                : 'hover:bg-accent/50'
            }`}
            onClick={() => onSelect(conversation._id)}
          >
            <div className='relative'>
              <Avatar
                className={`${
                  isMobile ? 'h-10 w-10' : 'h-12 w-12'
                } flex-shrink-0`}
              >
                <div className='bg-primary/10 w-full h-full flex items-center justify-center rounded-full'>
                  {otherUser.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </div>
              </Avatar>
              {isOnline && (
                <span
                  className={`absolute bottom-0 right-0 ${
                    isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'
                  } bg-green-500 border-2 border-background rounded-full`}
                ></span>
              )}
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex justify-between items-center'>
                <p
                  className={`font-medium truncate ${
                    isMobile ? 'text-sm' : ''
                  }`}
                >
                  {otherUser.name}
                </p>
                <span
                  className={`text-muted-foreground ${
                    isMobile ? 'text-[10px]' : 'text-xs'
                  }`}
                >
                  {updatedTime}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <p
                  className={`text-muted-foreground truncate ${
                    isMobile ? 'text-xs w-32 md:w-auto' : 'text-sm'
                  }`}
                >
                  {conversation.lastMessage || 'Start a conversation'}
                </p>
                {unreadCount > 0 && (
                  <span className='ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 md:px-2 py-0.5 md:py-1 font-medium'>
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
