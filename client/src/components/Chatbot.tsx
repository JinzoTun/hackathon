import { NoAgentNotification } from '@/components/NoAgentNotification';
import { RoomContext, useVoiceAssistant } from '@livekit/components-react';
import { Room, RoomEvent, ConnectionState } from 'livekit-client';
import { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { getConnectionDetails } from '@/api/chat';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

// Interface for chat messages
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const CONNECTION_TOKEN_KEY = 'CONNECTION_TOKEN';

interface VoiceAssistantProps {
  roomId?: string | null;
}

export default function VoiceAssistant({ roomId }: VoiceAssistantProps) {
  const [room, setRoom] = useState(() => new Room());
  const [connecting, setConnecting] = useState(false);
  const navigate = useNavigate();

  // Connect to room when component mounts or roomId changes
  useEffect(() => {

    const newRoom = new Room();
    setRoom(newRoom);

    // Connect with the new room instance
    const connectToRoom = async () => {
      try {
        setConnecting(true);
        const data = await getConnectionDetails();

        // Save connection details to localStorage
        localStorage.setItem(CONNECTION_TOKEN_KEY, JSON.stringify(data));

        // Connect to the room with new details
        await newRoom.connect(data.serverUrl, data.participantToken);
        setConnecting(false);
      } catch (error) {
        console.error('Failed to connect with provided roomId:', error);
        setConnecting(false);
        // Redirect back to chat list after a short delay
        setTimeout(() => navigate('/chat'), 1500);
      }
    };

    connectToRoom();

  }, [roomId, navigate]);

  return (
    <div className='h-full flex flex-col'>
      <RoomContext.Provider value={room}>
        <div className='flex-1 flex flex-col relative h-full'>
          <ChatInterface connecting={connecting} />
        </div>
      </RoomContext.Provider>
    </div>
  );
}

function ChatInterface(props: { connecting: boolean }) {
  const voiceAssistant = useVoiceAssistant();
  const { state: agentState } = voiceAssistant;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const roomContext = useContext(RoomContext);
  const [currentUserIdentity, setCurrentUserIdentity] = useState<string>('');
  const recentMessagesRef = useRef<Set<string>>(new Set());
  const [handlersRegistered, setHandlersRegistered] = useState<boolean>(false);
  const isMobile = window.innerWidth < 768;
  const { connecting } = props; // Extract the connecting prop

  // Handle back button click
  const handleBackToList = () => {
    // Use window.location.href for a full page reload to ensure state reset
    window.location.href = '/chat';
  };

  // Scroll to bottom when new messages come in
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: messagesEndRef.current.offsetTop,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Store current user identity
  useEffect(() => {
    if (roomContext?.localParticipant) {
      setCurrentUserIdentity(roomContext.localParticipant.identity);
      console.log(
        'Current user identity set to:',
        roomContext.localParticipant
      );
    }
  }, [roomContext?.localParticipant]);

  // Helper function to avoid duplicate messages
  const addMessageIfUnique = useCallback(
    (message: string, sender: 'user' | 'agent') => {
      // Create a unique key for this message to detect duplicates
      const messageKey = `${sender}:${message.trim()}:${Date.now()
        .toString()
        .slice(0, -3)}`;

      // Check if we've recently added this same message
      if (recentMessagesRef.current.has(messageKey)) {
        console.log('Duplicate message detected, ignoring:', message);
        return;
      }

      // Add to recent messages set
      recentMessagesRef.current.add(messageKey);

      // Add message to chat
      const newMessage = {
        id: `${sender}-${Date.now()}`,
        text: message,
        sender,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);

      // Remove from set after 2 seconds to prevent long-term duplication issues
      setTimeout(() => {
        recentMessagesRef.current.delete(messageKey);
      }, 2000);

      if (sender === 'agent') {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!roomContext) return;

    // Set up handlers for text streams from agent
    const setupTextHandlers = async () => {
      // Skip if handlers are already registered
      if (handlersRegistered) {
        console.log('Text stream handlers already registered, skipping setup');
        return;
      }

      try {
        console.log('Setting up text stream handlers');

        // Register handler for transcription messages from the agent
        roomContext.registerTextStreamHandler(
          'lk.transcription',
          async (reader, participantInfo) => {
            try {
              console.log(
                `Received text stream from ${participantInfo.identity} on 'lk.transcription' topic`
              );

              // Read all text content
              const message = await reader.readAll();
              if (!message || message.trim() === '') {
                console.log('Empty message received, ignoring');
                return;
              }

              console.log('Message content:', message);

              // Determine sender based on participant identity
              // If it contains "agent" or it's not the current user, it's from the agent
              const isFromAgent =
                participantInfo.identity.includes('agent') ||
                (currentUserIdentity &&
                  participantInfo.identity !== currentUserIdentity);

              addMessageIfUnique(message, isFromAgent ? 'agent' : 'user');
            } catch (e) {
              console.error('Error processing text stream:', e);
            }
          }
        );

        // Mark handlers as registered to prevent duplicate registration
        setHandlersRegistered(true);
        console.log('Text stream handlers setup complete');
      } catch (error) {
        console.error('Error setting up text stream handlers:', error);
      }
    };

    // Check room connection state safely
    const isConnected = roomContext.state === ConnectionState.Connected;

    if (isConnected) {
      setupTextHandlers();
    }

    // Set up event listener for connection state changes
    const onConnectionStateChanged = async (state: ConnectionState) => {
      if (state === ConnectionState.Connected) {
        await setupTextHandlers();
      } else if (state === ConnectionState.Disconnected) {
        // Reset the handlers registered flag when disconnected
        setHandlersRegistered(false);
      }
    };

    roomContext.on(RoomEvent.ConnectionStateChanged, onConnectionStateChanged);

    return () => {
      roomContext.off(
        RoomEvent.ConnectionStateChanged,
        onConnectionStateChanged
      );
    };
  }, [
    roomContext,
    currentUserIdentity,
    addMessageIfUnique,
    handlersRegistered,
  ]);

  const sendMessage = async () => {
    if (!inputText.trim() || !roomContext || isLoading) return;

    // Add user message to chat (using our deduplication function)
    addMessageIfUnique(inputText.trim(), 'user');
    setIsLoading(true);

    // Send message to agent
    try {
      console.log('Sending message:', inputText);

      // Create a text stream writer for the chat topic
      const writer = await roomContext.localParticipant.streamText({
        topic: 'lk.chat',
      });

      // Write the message to the stream
      await writer.write(inputText.trim());
      await writer.close();
      console.log('Message sent successfully');

      setInputText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  // Check if agent is not connected
  const isDisconnected =
    connecting ||
    agentState === 'connecting' ||
    !roomContext?.localParticipant?.permissions?.canPublish ||
    roomContext?.state === ConnectionState.Disconnected ||
    roomContext?.state === ConnectionState.Reconnecting;

  // Animation variants
  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const connectionStatusVariants = {
    connecting: { backgroundColor: '#f59e0b' },
    connected: { backgroundColor: '#10b981' },
  };

  return (
    <>
      <NoAgentNotification state={agentState} />

      {/* Chat Interface with fixed header */}
      <div className='flex flex-col h-screen relative'>
        {/* Fixed Header */}
        <motion.div
          className='absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/40 px-4 py-3 flex items-center justify-between'
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className='flex items-center'>
            {isMobile && (
              <Button
                variant='ghost'
                size='icon'
                className='mr-2 hover:bg-muted transition-colors'
                onClick={handleBackToList}
              >
                <ArrowLeft className='h-5 w-5' />
              </Button>
            )}
            <div className='flex items-center'>
              <div className='flex flex-col'>
                <div className='flex items-center gap-2'>
                  <h2 className='font-semibold text-sm sm:text-lg'>
                    AI Assistant
                  </h2>
                  <motion.div
                    className='w-2.5 h-2.5 rounded-full'
                    animate={isDisconnected ? 'connecting' : 'connected'}
                    variants={connectionStatusVariants}
                  ></motion.div>
                </div>
                <p className='text-xs text-muted-foreground'>
                  {isDisconnected ? 'Connecting...' : 'Ready to help'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className='absolute inset-0 overflow-y-auto pt-20 pb-24 sm:pb-20 px-2 sm:px-4 custom-scrollbar'
        >
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                className='h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className='bg-primary/5 rounded-full p-4 sm:p-6 mb-3 sm:mb-4'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageSquare className='h-8 w-8 sm:h-10 sm:w-10 text-primary/70' />
                </motion.div>
                <h3 className='text-base sm:text-lg font-medium mb-1'>
                  Start the conversation
                </h3>
                <p className='text-xs sm:text-sm max-w-[250px] sm:max-w-md'>
                  Ask me anything about farming, crops, or plant diseases
                </p>
              </motion.div>
            ) : (
              <div className='space-y-3 sm:space-y-4 min-h-full'>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                    variants={messageVariants}
                    initial='hidden'
                    animate='visible'
                    exit='exit'
                  >
                    <motion.div
                      className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl max-w-[75%] sm:max-w-[85%] ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted dark:bg-muted/80 border border-border/20 shadow-sm'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <p className='whitespace-pre-wrap break-words text-xs sm:text-sm'>
                        {msg.text}
                      </p>
                      <div
                        className={`text-[8px] sm:text-[10px] ${
                          msg.sender === 'user'
                            ? 'text-primary-foreground/70 text-right'
                            : 'text-muted-foreground'
                        } mt-1`}
                      >
                        {new Intl.DateTimeFormat('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        }).format(msg.timestamp)}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    className='flex justify-start'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className='px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-muted dark:bg-muted/80 flex items-center gap-1 sm:gap-2 border border-border/20 shadow-sm'>
                      <Loader2 className='h-3 w-3 sm:h-4 sm:w-4 animate-spin' />
                      <span className='text-xs sm:text-sm'>Thinking...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className='h-1' />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Fixed footer with input  */}
        <motion.div
          className='absolute bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-t border-border/40 p-2 sm:p-4 w-full'
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className='flex items-center gap-2 max-w-3xl mx-auto'>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder='Type a message...'
              className='flex-grow text-sm sm:text-base h-10 sm:h-12 rounded-full pr-12 bg-muted/40 dark:bg-muted/20 border-border/50 focus:border-primary transition-colors focus-visible:ring-1 focus-visible:ring-primary'
              disabled={isDisconnected || isLoading}
              autoFocus
            />
            <Button
              onClick={sendMessage}
              disabled={!inputText.trim() || isDisconnected || isLoading}
              className='flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 p-0 rounded-full absolute right-[26px] sm:right-[28px]'
              size='icon'
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Send className='h-4 w-4' />
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
