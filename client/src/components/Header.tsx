import { Link } from 'react-router-dom';
import { ModeToggle } from './mode-toggle';
import { useAuth } from '@/api/AuthContext';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetTitle,
  SheetContent,
  SheetDescription,
  SheetTrigger,
} from './ui/sheet';
import { Menu, X, User, LogOut, MessageSquare, Bell } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useState, useEffect } from 'react';
import { useSocket } from '@/api/SocketContext';
import { getUnreadCounts } from '@/api/chatService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { hasUnreadMessages, notifications, clearNotifications } = useSocket();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { t } = useTranslation();

  // Fetch unread message count
  useEffect(() => {
    if (user) {
      const fetchUnreadCounts = async () => {
        const data = await getUnreadCounts();
        setUnreadCount(data.totalUnread || 0);
      };

      fetchUnreadCounts();

      // Update counts when new messages arrive
      if (hasUnreadMessages) {
        fetchUnreadCounts();
      }
    }
  }, [user, hasUnreadMessages]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUnreadCount(0); // Reset unread count on logout
      toast.success(t('loggedOutSuccessfully'));
      navigate('/auth/login'); // Optionally, redirect to login page or show a message
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const navItems = [
    { label: t('home'), path: '/map' },
    { label: t('Dashboard'), path: '/dashboard' },
    { label: t('Profile'), path: '/profile' },
    { label: t('chat'), path: '/chat' },
  ];

  return (
    <header className='sticky top-0 z-35 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='p-2 flex h-16 items-center justify-between'>
        <div className='flex items-center gap-4'>
          {isMobile && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon' aria-label='Menu'>
                  <Menu className='size-5' />
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='p-0 pt-10'>
                <div className=''>
                  <SheetTitle className='font-semibold text-lg'></SheetTitle>
                  <SheetDescription className='text-sm text-muted-foreground'></SheetDescription>
                </div>

                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-4 top-4'
                  onClick={() => setIsOpen(false)}
                >
                  <X className='size-5' />
                </Button>
                <nav className='flex flex-col space-y-1 p-4'>
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className='flex h-10 items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground'
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                      {item.path === '/chat' && unreadCount > 0 && (
                        <span className='ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-medium'>
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          )}
          <Link to='/' className='flex items-center'>
            <span className='font-bold text-xl'>{t('agrilink')}</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className='hidden md:flex items-center space-x-8'>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className='text-foreground hover:text-primary transition-colors font-medium flex items-center'
            >
              {item.label}
              {item.path === '/chat' && unreadCount > 0 && (
                <span className='ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-medium'>
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className='flex items-center gap-4'>
          <ModeToggle />
          <LanguageSwitcher />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='relative'
                  aria-label='Notifications'
                >
                  <Bell className='size-5' />
                  {notifications.length > 0 && (
                    <span className='absolute top-0 right-0 w-2 h-2 bg-primary rounded-full' />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-80'>
                <div className='p-2 font-medium border-b'>
                  {t('notifications')}
                </div>
                <div className='max-h-80 overflow-y-auto'>
                  {notifications.length === 0 ? (
                    <div className='p-4 text-center text-muted-foreground text-sm'>
                      {t('noNewNotifications')}
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        to={notification.type === 'newMessage' ? '/chat' : '/'}
                        onClick={clearNotifications}
                      >
                        <div className='p-3 hover:bg-accent flex cursor-pointer'>
                          <div className='flex items-start gap-3'>
                            <MessageSquare className='size-5 text-primary' />
                            <div>
                              <p className='text-sm'>{notification.message}</p>
                              <p className='text-xs text-muted-foreground'>
                                {new Date(
                                  notification.timestamp
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className='p-2 border-t'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full'
                      onClick={clearNotifications}
                    >
                      {t('clearAll')}
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='rounded-full'
                  aria-label='User menu'
                >
                  <Avatar className='size-8'>
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <div className='flex flex-col space-y-1 p-2'>
                  <p className='px-2 py-1.5 text-sm font-semibold'>
                    {user.name}
                  </p>
                  <p className='px-2 text-xs text-muted-foreground'>
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to='/profile'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <User className='size-4' />
                    <span>{t('Profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to='/chat'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <MessageSquare className='size-4' />
                    <span>{t('chat')}</span>
                    {unreadCount > 0 && (
                      <span className='ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-medium'>
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className='flex items-center gap-2 cursor-pointer text-destructive'
                >
                  <LogOut className='size-4' />
                  <span>{t('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant='default'>
              <Link to='/auth/login'>{t('login')}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
