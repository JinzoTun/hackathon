import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from './ui/sonner';
import { useAuth } from '@/api/AuthContext';

const Layout = () => {
  const location = useLocation();
  const { isLoading } = useAuth();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className='h-screen w-full flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-1 container mx-auto px-4 py-6 md:px-6 md:py-8'>
        <Outlet />
      </main>
      <Footer />
      <Toaster position='top-right' />
    </div>
  );
};

export default Layout;
