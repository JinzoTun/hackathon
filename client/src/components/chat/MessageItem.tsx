import React, { useState } from 'react';
import { Message, rateAdvice } from '@/api/chatService';
import { format } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Star, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  isMobile?: boolean;
  onReplyToAdvice?: (requestMessage: Message) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwnMessage,
  isMobile = false,
  onReplyToAdvice,
}) => {
  const timestamp = format(new Date(message.createdAt), 'h:mm a');
  const [isRating, setIsRating] = useState(false);

  // Get the sender's name or initial safely
  const getSenderName = () => {
    // Handle different possible message sender formats
    if (typeof message.sender === 'object' && message.sender !== null) {
      return message.sender.name || 'User';
    }
    return 'User';
  };

  // Get the name initials
  const getInitials = (name: string) => {
    if (!name || name === 'User') return 'U';

    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Handle rating an advice
  const handleRateAdvice = async (rating: number) => {
    setIsRating(true);
    try {
      const success = await rateAdvice(message._id, rating);
      if (success) {
        toast.success(`You rated this advice ${rating}/5 stars`);
        // Update the UI without requiring a refresh
        message.rating = rating;
      } else {
        toast.error('Could not submit your rating. Please try again.');
      }
    } catch (error) {
      console.error('Error rating advice:', error);
    } finally {
      setIsRating(false);
    }
  };

  const renderRatingStars = () => {
    // If message already has a rating, show it as static stars
    if (message.rating) {
      return (
        <div className='flex items-center mt-1'>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'h-4 w-4',
                star <= message.rating!
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300'
              )}
            />
          ))}
        </div>
      );
    }

    // If this is an advice response sent to the current user (not own message)
    // and not yet rated, allow rating
    if (message.isAdviceResponse && !isOwnMessage && !message.rating) {
      return (
        <div className='mt-2'>
          <p className='text-xs text-muted-foreground mb-1'>
            Rate this advice:
          </p>
          <div className='flex gap-1'>
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                size='sm'
                variant='ghost'
                disabled={isRating}
                className='h-6 w-6 p-0'
                onClick={() => handleRateAdvice(star)}
              >
                <Star className='h-4 w-4' />
              </Button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        'flex gap-2 md:gap-3',
        isMobile ? 'max-w-[90%]' : 'max-w-[80%]',
        isOwnMessage ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {!isOwnMessage && (
        <Avatar className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} flex-shrink-0`}>
          <div className='bg-primary/10 w-full h-full flex items-center justify-center rounded-full'>
            {getInitials(getSenderName())}
          </div>
        </Avatar>
      )}

      <div>
        <div
          className={cn(
            'rounded-2xl p-2 md:p-3',
            message.isAdviceRequest
              ? 'bg-amber-100 dark:bg-amber-900'
              : message.isAdviceResponse
              ? 'bg-teal-100 dark:bg-teal-900'
              : isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          {message.isAdviceRequest && (
            <div className='flex items-center gap-1 mb-1 text-amber-600 dark:text-amber-400'>
              <HelpCircle className='h-4 w-4' />
              <span className='text-xs font-medium'>Conseil Request</span>
            </div>
          )}
          {message.isAdviceResponse && (
            <div className='flex items-center gap-1 mb-1 text-teal-600 dark:text-teal-400'>
              <Star className='h-4 w-4' />
              <span className='text-xs font-medium'>Conseil</span>
            </div>
          )}
          <p className={isMobile ? 'text-sm' : ''}>{message.content}</p>

          {renderRatingStars()}

          {/* Button to reply with advice */}
          {message.isAdviceRequest && onReplyToAdvice && !isOwnMessage && (
            <Button
              variant='outline'
              size='sm'
              className='mt-2 text-xs'
              onClick={() => onReplyToAdvice(message)}
            >
              Provide conseil
            </Button>
          )}
        </div>
        <div
          className={cn(
            'text-[10px] md:text-xs text-muted-foreground mt-1',
            isOwnMessage ? 'text-right' : 'text-left'
          )}
        >
          {timestamp}
          {isOwnMessage && message.read && (
            <span className='ml-1 text-blue-500'>✓</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
