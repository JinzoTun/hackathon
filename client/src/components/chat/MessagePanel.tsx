import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage } from '@/api/chatService';
import { Message, User } from '@/api/chatService';
import { useAuth } from '@/api/AuthContext';
import { useSocket } from '@/api/SocketContext';
import { useIsMobile } from '@/hooks/use-mobile';
import MessageItem from './MessageItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, HelpCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface MessagePanelProps {
  recipientId: string;
  recipientName: string;
}

const MessagePanel: React.FC<MessagePanelProps> = ({
  recipientId,
  recipientName,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { socket } = useSocket();
  const isMobile = useIsMobile();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Conseil/advice state
  const [isAdviceDialogOpen, setIsAdviceDialogOpen] = useState(false);
  const [adviceContent, setAdviceContent] = useState('');
  const [isAdviceRequestDialogOpen, setIsAdviceRequestDialogOpen] =
    useState(false);
  const [adviceRequestContent, setAdviceRequestContent] = useState('');
  const [replyToAdviceRequest, setReplyToAdviceRequest] =
    useState<Message | null>(null);

  // Helper function to safely extract IDs regardless of format
  const getSenderId = (message: any): string => {
    if (message?.sender?._id) return message.sender._id.toString();
    if (typeof message?.sender === 'string') return message.sender;
    return '';
  };

  const getRecipientId = (message: any): string => {
    if (message?.recipient?._id) return message.recipient._id.toString();
    if (typeof message?.recipient === 'string') return message.recipient;
    return '';
  };

  // Safely format date or return fallback
  const safeFormatDate = (
    dateStr: string,
    formatStr: string,
    fallback: string = 'Unknown date'
  ): string => {
    try {
      const date = new Date(dateStr);
      return isValid(date) ? format(date, formatStr) : fallback;
    } catch (error) {
      return fallback;
    }
  };

  // Fetch messages when recipient changes
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const data = await getMessages(recipientId);

        // Ensure each message has the correct structure before setting to state
        if (user && Array.isArray(data)) {
          const processedMessages = data.map((message) => {
            // Create properly typed User objects
            const senderUser: User =
              typeof message.sender === 'string'
                ? { _id: message.sender, name: 'User', email: '' }
                : message.sender || { _id: '', name: 'Unknown', email: '' };

            const recipientUser: User =
              typeof message.recipient === 'string'
                ? { _id: message.recipient, name: 'User', email: '' }
                : message.recipient || { _id: '', name: 'Unknown', email: '' };

            // Return a properly typed Message object
            return {
              _id: message._id || `temp-${Date.now()}`,
              sender: senderUser,
              recipient: recipientUser,
              content: message.content || '',
              createdAt: message.createdAt || new Date().toISOString(),
              updatedAt: message.updatedAt || new Date().toISOString(),
              read: !!message.read,
              isAdviceRequest: !!message.isAdviceRequest,
              isAdviceResponse: !!message.isAdviceResponse,
              relatedAdviceRequestId: message.relatedAdviceRequestId || null,
              rating: message.rating || null,
            };
          });

          setMessages(processedMessages);
        } else {
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (recipientId) {
      fetchMessages();
    }
  }, [recipientId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Listen for new messages from socket
  useEffect(() => {
    if (!socket || !user) return;

    // Handle receiving new messages
    const handleReceiveMessage = (message: any) => {
      if (!message) return;

      const senderId = getSenderId(message);
      const messageRecipientId = getRecipientId(message);
      const currentUserId = user._id?.toString() || '';

      // Check if message belongs to this conversation
      if (
        (senderId === recipientId && messageRecipientId === currentUserId) ||
        (senderId === currentUserId && messageRecipientId === recipientId)
      ) {
        // Create properly typed User objects
        const senderUser: User =
          typeof message.sender === 'string'
            ? { _id: message.sender, name: 'User', email: '' }
            : message.sender || { _id: '', name: 'Unknown', email: '' };

        const recipientUser: User =
          typeof message.recipient === 'string'
            ? { _id: message.recipient, name: 'User', email: '' }
            : message.recipient || { _id: '', name: 'Unknown', email: '' };

        // Create a properly typed Message object
        const normalizedMessage: Message = {
          _id: message._id || `temp-${Date.now()}`,
          sender: senderUser,
          recipient: recipientUser,
          content: message.content || '',
          createdAt: message.createdAt || new Date().toISOString(),
          updatedAt: message.updatedAt || new Date().toISOString(),
          read: !!message.read,
          isAdviceRequest: !!message.isAdviceRequest,
          isAdviceResponse: !!message.isAdviceResponse,
          relatedAdviceRequestId: message.relatedAdviceRequestId || null,
          rating: message.rating || null,
        };

        setMessages((prev) => [...prev, normalizedMessage]);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageSent', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageSent', handleReceiveMessage);
    };
  }, [socket, recipientId, user]);

  // Handle typing indicators
  const handleTyping = () => {
    if (!socket) return;

    socket.emit('typing', { recipientId });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a new timeout to emit stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { recipientId });
    }, 1000);
  };

  // Handle message submission
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !socket || !user) {
      return;
    }

    setIsSending(true);

    // Send message via socket
    socket.emit('sendMessage', {
      recipientId,
      content: newMessage.trim(),
    });

    // Clear the input
    setNewMessage('');
    setTimeout(() => setIsSending(false), 500);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('stopTyping', { recipientId });
    }
  };

  // Handle sending an advice request
  const handleSendAdviceRequest = async () => {
    if (!adviceRequestContent.trim() || !socket || !user) {
      return;
    }

    setIsSending(true);

    try {
      // Send advice request message via API
      const result = await sendMessage(
        recipientId,
        adviceRequestContent.trim(),
        {
          isAdviceRequest: true,
        }
      );

      if (result) {
        toast.success('Your request for advice has been sent successfully.');

        // Close dialog and reset
        setIsAdviceRequestDialogOpen(false);
        setAdviceRequestContent('');
      }
    } catch (error) {
      console.error('Error sending advice request:', error);
      toast.error('Could not send your advice request. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle sending an advice response
  const handleSendAdviceResponse = async () => {
    if (!adviceContent.trim() || !socket || !user || !replyToAdviceRequest) {
      return;
    }

    setIsSending(true);

    try {
      // Send advice response message via API
      const result = await sendMessage(recipientId, adviceContent.trim(), {
        isAdviceResponse: true,
        relatedAdviceRequestId: replyToAdviceRequest._id,
      });

      if (result) {
        toast.success('Your advice has been sent successfully.');

        // Close dialog and reset
        setIsAdviceDialogOpen(false);
        setAdviceContent('');
        setReplyToAdviceRequest(null);
      }
    } catch (error) {
      console.error('Error sending advice:', error);
      toast.error('Could not send your advice. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle replying to an advice request
  const handleReplyToAdvice = (requestMessage: Message) => {
    setReplyToAdviceRequest(requestMessage);
    setIsAdviceDialogOpen(true);
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [date: string]: Message[] } = {};

    messages.forEach((message) => {
      try {
        const date = safeFormatDate(
          message.createdAt,
          'yyyy-MM-dd',
          'unknown-date'
        );
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(message);
      } catch (error) {
        // Skip message if date parsing fails
        console.error('Error processing message date:', error);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b border-gray-200 dark:border-gray-800 flex items-center'>
        <h3
          className={`text-lg font-semibold flex-1 ${
            isMobile ? 'text-center ml-6' : ''
          }`}
        >
          {recipientName}
        </h3>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setIsAdviceRequestDialogOpen(true)}
          className='flex items-center gap-1'
        >
          <HelpCircle className='h-4 w-4' />
          <span>Ask for conseil</span>
        </Button>
      </div>

      {/* Messages area */}
      <div className='flex-1 overflow-y-auto p-2 md:p-4'>
        {isLoading ? (
          <div className='flex items-center justify-center h-full'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : messages.length === 0 ? (
          <div className='flex items-center justify-center h-full text-center'>
            <div>
              <p className='text-muted-foreground'>No messages yet</p>
              <p className='text-sm text-muted-foreground mt-1'>
                Send a message to start the conversation
              </p>
            </div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className='mb-4 md:mb-6'>
              <div className='text-xs text-center text-muted-foreground mb-2 md:mb-4'>
                <span className='bg-background px-2'>
                  {date === 'unknown-date'
                    ? 'Unknown date'
                    : safeFormatDate(date, 'MMM d, yyyy', 'Unknown date')}
                </span>
              </div>
              <div className='space-y-2 md:space-y-3'>
                {msgs.map((message) => {
                  // Make sure we properly identify the message owner
                  const senderId = getSenderId(message);
                  // Ensure we always return a boolean value
                  const isOwnMessage = Boolean(
                    user && senderId === user._id?.toString()
                  );

                  return (
                    <MessageItem
                      key={message._id}
                      message={message}
                      isOwnMessage={isOwnMessage}
                      isMobile={isMobile}
                      onReplyToAdvice={handleReplyToAdvice}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSendMessage}
        className='p-2 md:p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2'
      >
        <Input
          type='text'
          placeholder='Type a message...'
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyUp={handleTyping}
          disabled={isSending || !socket}
          className='flex-1'
        />
        <Button
          type='submit'
          disabled={!newMessage.trim() || isSending || !socket}
          className={isMobile ? 'px-3' : ''}
        >
          {isSending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Send className='h-4 w-4' />
          )}
        </Button>
      </form>

      {/* Advice Request Dialog */}
      <Dialog
        open={isAdviceRequestDialogOpen}
        onOpenChange={setIsAdviceRequestDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request conseil (advice)</DialogTitle>
            <DialogDescription>
              Ask {recipientName} for advice or recommendations.
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <Textarea
              placeholder='Describe what you need advice about...'
              value={adviceRequestContent}
              onChange={(e) => setAdviceRequestContent(e.target.value)}
              className='min-h-[100px]'
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsAdviceRequestDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendAdviceRequest}
              disabled={!adviceRequestContent.trim() || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending
                </>
              ) : (
                'Send Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advice Response Dialog */}
      <Dialog open={isAdviceDialogOpen} onOpenChange={setIsAdviceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide conseil (advice)</DialogTitle>
            <DialogDescription>
              Respond to {recipientName}'s request for advice. Your advice will
              be rated.
            </DialogDescription>
          </DialogHeader>
          {replyToAdviceRequest && (
            <div className='bg-muted p-3 rounded-md'>
              <p className='text-xs font-medium mb-1'>Request:</p>
              <p className='text-sm'>{replyToAdviceRequest.content}</p>
            </div>
          )}
          <div className='py-4'>
            <Textarea
              placeholder='Provide your advice or recommendations...'
              value={adviceContent}
              onChange={(e) => setAdviceContent(e.target.value)}
              className='min-h-[100px]'
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsAdviceDialogOpen(false);
                setReplyToAdviceRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendAdviceResponse}
              disabled={!adviceContent.trim() || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending
                </>
              ) : (
                'Send Advice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagePanel;
