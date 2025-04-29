import { useAuth } from '@/api/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className='h-screen w-full flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL so we can redirect after login
    return (
      <Navigate to='/auth/login' state={{ from: location.pathname }} replace />
    );
  }

  // If there are children, render them, otherwise render the Outlet
  return <>{children ?? <Outlet />}</>;
};

export default ProtectedRoute;
