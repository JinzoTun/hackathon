// React Router imports
import { Routes, Route } from 'react-router-dom';

// Context providers
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/api/AuthContext';
import { SocketProvider } from '@/api/SocketContext';

// Layout components
import Layout from '@/components/Layout';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';

// Page components
import LandingPage from '@/pages/LandingPage';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import NotFound from '@/pages/NotFound';

// Commented out for future use
// import Chatbot from '@/components/Chatbot';

/**
 * Main application component that sets up routing and context providers
 */
function App() {
  // Standard layout with Header and Footer
  const StandardLayout = ({ children }: { children: React.ReactNode }) => (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );

  // Header-only layout for pages that don't need a footer
  const HeaderOnlyLayout = ({ children }: { children: React.ReactNode }) => (
    <>
      <Header />
      {children}
    </>
  );

  return (
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
          <Routes>
            {/* Public routes */}
            <Route
              index
              element={
                <StandardLayout>
                  <LandingPage />
                </StandardLayout>
              }
            />

            {/* Auth Routes */}
            <Route path='/auth'>
              <Route path='login' element={<LoginPage />} />
              <Route path='register' element={<RegisterPage />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              {/* Profile route with Layout component */}
              <Route path='profile' element={<Layout />}>
                <Route index element={<Profile />} />
                {/* <Route path=':userId' element={<Profile />} /> */}
              </Route>

              {/* Other protected routes */}
              <Route
                path='map'
                element={
                  <StandardLayout>
                    <Home />
                  </StandardLayout>
                }
              />

              <Route
                path='dashboard'
                element={
                  <HeaderOnlyLayout>
                    <Dashboard />
                  </HeaderOnlyLayout>
                }
              />

              <Route
                path='chat'
                element={
                  <HeaderOnlyLayout>
                    <Chat />
                  </HeaderOnlyLayout>
                }
              />

              {/* <Route path='chatbot' element={<Chatbot />} /> */}
            </Route>

            {/* General routes */}
            <Route path='/' element={<Layout />}>
              {/* 404 page - catch all unmatched routes */}
              <Route path='*' element={<NotFound />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
