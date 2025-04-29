import React, { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { User } from '@/api/chatService';
import { useSocket } from '@/api/SocketContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface UserListProps {
  users: User[];
  onSelect: (user: User) => void;
  selectedUserId?: string;
}

const UserList: React.FC<UserListProps> = ({
  users,
  onSelect,
  selectedUserId,
}) => {
  const { onlineUsers } = useSocket();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');

  if (users.length === 0) {
    return (
      <div className='text-center py-4 text-muted-foreground'>
        <p>No users available</p>
      </div>
    );
  }

  // Filter users by search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort users by online status (online first) and then by name
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aOnline = onlineUsers.has(a._id);
    const bOnline = onlineUsers.has(b._id);

    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;

    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <div className='mb-2 relative'>
        <Input
          placeholder='Search by name...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`pl-8 ${isMobile ? 'h-8 text-sm' : ''}`}
        />
        <Search
          className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground ${
            isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
          }`}
        />
      </div>

      {sortedUsers.length === 0 ? (
        <div className='text-center py-2 text-muted-foreground text-sm'>
          <p>No users match your search</p>
        </div>
      ) : (
        <div className='space-y-1'>
          {sortedUsers.map((user) => {
            const isOnline = onlineUsers.has(user._id);

            return (
              <div
                key={user._id}
                className={`p-1.5 md:p-2 rounded-md cursor-pointer transition-colors flex items-center gap-1.5 md:gap-2 ${
                  selectedUserId === user._id
                    ? 'bg-accent'
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => onSelect(user)}
              >
                <div className='relative'>
                  <Avatar className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`}>
                    <div className='bg-primary/10 w-full h-full flex items-center justify-center rounded-full'>
                      {user.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  </Avatar>
                  {isOnline && (
                    <span
                      className={`absolute bottom-0 right-0 ${
                        isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'
                      } bg-green-500 border-2 border-background rounded-full`}
                    ></span>
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <p
                    className={`${
                      isMobile ? 'text-xs' : 'text-sm'
                    } font-medium truncate`}
                  >
                    {user.name}
                  </p>
                </div>

                {isOnline && (
                  <span
                    className={`${
                      isMobile ? 'text-[10px]' : 'text-xs'
                    } text-green-600 dark:text-green-400`}
                  >
                    online
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default UserList;
