import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/api/AuthContext';
import { useSocket } from '@/api/SocketContext';
import { getUsers, getConversations } from '@/api/chatService';
import { Conversation, User } from '@/api/chatService';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, Menu, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

import ConversationList from '@/components/chat/ConversationList';
import MessagePanel from '@/components/chat/MessagePanel';
import UserList from '@/components/chat/UserList';
import VoiceAssistant from '@/components/Chatbot';

const Chat = () => {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const isMobile = useIsMobile();
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();

  // On mobile, hide sidebar when a conversation is selected
  useEffect(() => {
    if (isMobile && (selectedUser || showAIChat)) {
      setShowSidebar(false);
    }
  }, [selectedUser, isMobile, showAIChat]);

  // Get conversations and users on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [conversationsData, usersData] = await Promise.all([
          getConversations(),
          getUsers(),
        ]);

        setConversations(conversationsData);
        // Filter out current user from users list
        if (currentUser) {
          setUsers(usersData.filter((u) => u._id !== currentUser._id));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [currentUser]);

  // Listen for socket events to update conversations
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('receiveMessage', () => {
      // Refresh conversations to update the last message and unread counts
      getConversations().then((data) => setConversations(data));
    });

    // Listen for message sent confirmation
    socket.on('messageSent', () => {
      // Refresh conversations to update the last message
      getConversations().then((data) => setConversations(data));
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('messageSent');
    };
  }, [socket]);

  // Handle selecting a conversation
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setSelectedUser(null);
    setShowAIChat(false);

    // Find the conversation and set the selected user
    const conversation = conversations.find((c) => c._id === conversationId);
    if (conversation && currentUser) {
      // Find the other user in the conversation
      const otherUser = conversation.participants.find(
        (p) => p._id !== currentUser._id
      );
      if (otherUser) {
        setSelectedUser(otherUser);
      }
    }
  };

  // Handle selecting a user to start a new conversation
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedConversation(null);
    setShowAIChat(false);

    // Check if a conversation already exists with this user
    if (currentUser) {
      const existingConversation = conversations.find((c) =>
        c.participants.some((p) => p._id === user._id)
      );

      if (existingConversation) {
        setSelectedConversation(existingConversation._id);
      }
    }
  };

  // Handle selecting the AI chatbot
  const handleSelectAIChat = () => {
    setShowAIChat(true);
    setSelectedUser(null);
    setSelectedConversation(null);
  };

  // Go back to conversation list on mobile
  const handleBackToList = () => {
    setShowSidebar(true);
  };

  return (
    <div className='flex h-[calc(100vh-64px)]'>
      {/* Sidebar with conversations and users */}
      <div
        className={`${
          isMobile
            ? `fixed inset-0 z-30 bg-background transition-transform duration-300 overflow-hidden ${
                showSidebar ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-1/4 border-r border-gray-200 dark:border-gray-800'
        } overflow-y-auto`}
      >
        <div className='p-4'>
          <h2 className='text-xl font-semibold mb-4 mt-16 lg:mt-0'>
            {t('chatPage.messages')}
          </h2>

          {/* AI Chatbot Button */}
          <div className='mb-4'>
            <Button
              onClick={handleSelectAIChat}
              variant='outline'
              className='w-full flex items-center gap-2 justify-start h-14 bg-primary/5 hover:bg-primary/10'
            >
              <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/20'>
                <Bot className='h-5 w-5 text-primary' />
              </div>
              <div className='flex flex-col items-start'>
                <span className='text-sm font-medium'>
                  {t('chatPage.aiAssistant')}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {t('chatPage.farmingAdvice')}
                </span>
              </div>
            </Button>
          </div>

          {isLoading ? (
            <div className='flex justify-center my-4'>
              <p>{t('chatPage.loading')}</p>
            </div>
          ) : (
            <>
              <ConversationList
                conversations={conversations}
                currentUserId={currentUser?._id || ''}
                onSelect={handleSelectConversation}
                selectedConversationId={selectedConversation}
              />

              <div className='mt-6'>
                <h3 className='text-sm font-medium mb-2'>
                  {t('chatPage.allUsers')}
                </h3>
                <UserList
                  users={users}
                  onSelect={handleSelectUser}
                  selectedUserId={selectedUser?._id}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div
        className={`${isMobile ? 'w-full' : 'flex-1'} flex flex-col relative`}
      >
        {isMobile && (selectedUser || showAIChat) && (
          <Button
            variant='ghost'
            size='icon'
            className='absolute top-2 left-2 z-10'
            onClick={handleBackToList}
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
        )}

        {showAIChat ? (
          <VoiceAssistant />
        ) : selectedUser ? (
          <MessagePanel
            recipientId={selectedUser._id}
            recipientName={selectedUser.name}
          />
        ) : (
          <div className='flex-1 flex items-center justify-center text-center p-8'>
            {isMobile && !showSidebar ? (
              <Button
                variant='outline'
                onClick={handleBackToList}
                className='flex items-center gap-2'
              >
                <Menu className='h-4 w-4' />
                {t('chatPage.showConversations')}
              </Button>
            ) : (
              <div>
                <h3 className='text-xl font-semibold mb-2'>
                  {t('chatPage.selectConversation')}
                </h3>
                <p className='text-muted-foreground'>
                  {t('chatPage.chooseUser')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
