import { RouterProvider } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/contexts/AuthContext';
import { router } from './routes';
import { AuthPage } from './app/pages/AuthPage';
import { Toaster } from 'sonner';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-gray-50 h-screen w-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading ZIVI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}