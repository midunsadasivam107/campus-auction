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
import AIAssistantPage from './pages/AIAssistantPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <div className="min-h-screen bg-black text-slate-100 flex flex-col">
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
                  <Route path="/ai" element={<AIAssistantPage />} />
                </Routes>
              </main>
              <footer className="bg-[#0a0a0d] border-t border-zinc-800/80 py-6 text-center text-sm text-zinc-500">
                <div className="max-w-7xl mx-auto px-4">
                  <p className="text-zinc-400">
                    🎓 <span className="text-red-500 font-semibold">Campus Auction</span> — Student Marketplace for graduating & junior
                    students
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Real-time Bidding • Anti-Sniping Protection • Campus Handover
                  </p>
                </div>
              </footer>
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#121217',
                  color: '#ffffff',
                  border: '1px solid #272730',
                },
              }}
            />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
