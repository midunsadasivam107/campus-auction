import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CreateListingPage from './pages/CreateListingPage';
import EditListingPage from './pages/EditListingPage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import SearchResultsPage from './pages/SearchResultsPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import NotificationsPage from './pages/NotificationsPage';
import SavedSearchesPage from './pages/SavedSearchesPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchResultsPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/sell" element={<CreateListingPage />} />
                  <Route path="/auction/:id" element={<AuctionDetailPage />} />
                  <Route path="/auction/:id/edit" element={<EditListingPage />} />
                  <Route path="/dashboard/selling" element={<SellerDashboardPage />} />
                  <Route path="/dashboard/buying" element={<BuyerDashboardPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/saved-searches" element={<SavedSearchesPage />} />
                </Routes>
              </main>
              <footer className="bg-white border-t border-slate-200 py-6 text-center text-sm text-slate-500">
                <div className="max-w-7xl mx-auto px-4">
                  <p>
                    🎓 Campus Auction — Student Marketplace for graduating & junior
                    students
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Built with React, Express, MongoDB & Socket.IO
                  </p>
                </div>
              </footer>
            </div>
            <Toaster position="top-right" />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
